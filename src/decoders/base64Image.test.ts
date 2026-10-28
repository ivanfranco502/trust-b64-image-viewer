import { describe, expect, it } from 'vitest';
import { decode } from './base64Image';

// 1x1 transparent PNG, 68 bytes.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('base64 image decoder — raw base64', () => {
  it('decodes a PNG and reports its type and byte length', () => {
    expect(decode(PNG)).toEqual({
      ok: true,
      value: { mimeType: 'image/png', byteLength: 68, dataUrl: `data:image/png;base64,${PNG}` },
    });
  });

  it.each([
    ['image/jpeg', '\xff\xd8\xff\xe0'],
    ['image/gif', 'GIF89a'],
    ['image/gif', 'GIF87a'],
    ['image/webp', 'RIFF\x00\x00\x00\x00WEBPVP8 '],
    ['image/avif', '\x00\x00\x00\x1cftypavif'],
    ['image/bmp', 'BM\x00\x00'],
    ['image/x-icon', '\x00\x00\x01\x00'],
    ['image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
    ['image/svg+xml', '<?xml version="1.0"?>\n<svg></svg>'],
    ['image/svg+xml', '\xef\xbb\xbf  <svg></svg>'],
  ])('detects %s from magic bytes', (mimeType, bytes) => {
    const result = decode(btoa(bytes));
    expect(result.ok && result.value.mimeType).toBe(mimeType);
  });

  it('ignores surrounding whitespace and line breaks', () => {
    const wrapped = `  \n${PNG.slice(0, 40)}\n${PNG.slice(40, 76)}\r\n${PNG.slice(76)}\n  `;
    expect(decode(wrapped)).toEqual(decode(PNG));
  });

  it('accepts input without padding', () => {
    expect(decode(PNG.replace(/=+$/, ''))).toEqual(decode(PNG));
  });

  it('returns ok:false for an unknown format', () => {
    const result = decode(btoa('hello world'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unknown image format/i);
    }
  });
});

describe('base64 image decoder — data URI', () => {
  it('uses the declared type', () => {
    const result = decode(`data:image/png;base64,${PNG}`);
    expect(result).toEqual({
      ok: true,
      value: { mimeType: 'image/png', byteLength: 68, dataUrl: `data:image/png;base64,${PNG}` },
    });
  });

  it('trusts the declared type even if the bytes differ', () => {
    const result = decode(`data:image/webp;base64,${PNG}`);
    expect(result.ok && result.value.mimeType).toBe('image/webp');
  });

  it('is case-insensitive and ignores extra parameters', () => {
    const result = decode(`DATA:IMAGE/SVG+XML;charset=utf-8;BASE64,${btoa('<svg></svg>')}`);
    expect(result.ok && result.value.mimeType).toBe('image/svg+xml');
  });

  it('detects the type from the bytes when the data URI has no type', () => {
    const result = decode(`data:;base64,${PNG}`);
    expect(result.ok && result.value.mimeType).toBe('image/png');
  });

  it('returns ok:false for a non-image type', () => {
    const result = decode(`data:text/plain;base64,${btoa('hello')}`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('text/plain');
    }
  });

  it('returns ok:false for a data URI that is not base64', () => {
    const result = decode('data:image/svg+xml,<svg></svg>');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/base64/);
    }
  });

  it('returns ok:false for a data URI with no payload', () => {
    expect(decode('data:image/png;base64,').ok).toBe(false);
  });
});

describe('base64 image decoder — invalid input', () => {
  it.each(['', '   \n  '])('returns ok:false for empty input %j', (input) => {
    expect(decode(input).ok).toBe(false);
  });

  it('returns ok:false for characters outside the base64 alphabet', () => {
    const result = decode('iVBORw0K*GgoAAAA');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not valid base64/);
    }
  });

  it('returns ok:false for padding in the middle', () => {
    expect(decode('iVBO=Rw0K').ok).toBe(false);
  });

  it('returns ok:false for an impossible length', () => {
    const result = decode('iVBORw0KG');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/invalid length/);
    }
  });
});
