export type DecodedImage = {
  mimeType: string;
  byteLength: number;
  dataUrl: string;
};

export type DecodeResult =
  | { ok: true; value: DecodedImage }
  | { ok: false; error: string };

const DATA_URI = /^data:([^,]*),(.*)$/is;
const BASE64_CHARS = /^[A-Za-z0-9+/]*$/;

export function decode(input: string): DecodeResult {
  let payload = input.trim();
  let declaredType = '';

  const dataUri = DATA_URI.exec(payload);
  if (dataUri) {
    const [type, ...params] = dataUri[1].split(';');
    if (!params.some((p) => p.trim().toLowerCase() === 'base64')) {
      return { ok: false, error: 'Data URI is not base64-encoded (missing ";base64").' };
    }
    declaredType = type.trim().toLowerCase();
    if (declaredType && !declaredType.startsWith('image/')) {
      return { ok: false, error: `Data URI type "${declaredType}" is not an image type.` };
    }
    payload = dataUri[2];
  }

  // Base64 is often line-wrapped, and padding is optional in practice.
  payload = payload.replace(/\s+/g, '').replace(/=+$/, '');
  if (payload === '') {
    return { ok: false, error: 'No base64 data to preview.' };
  }
  if (!BASE64_CHARS.test(payload)) {
    return { ok: false, error: 'Input contains characters that are not valid base64.' };
  }
  if (payload.length % 4 === 1) {
    return { ok: false, error: 'Base64 data has an invalid length. It may be truncated.' };
  }
  payload = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');

  const bytes = atob(payload);
  const mimeType = declaredType || detectMimeType(bytes);
  if (!mimeType) {
    return {
      ok: false,
      error: 'Unknown image format. Add a data URI prefix to set the type, e.g. "data:image/png;base64,".',
    };
  }

  return {
    ok: true,
    value: { mimeType, byteLength: bytes.length, dataUrl: `data:${mimeType};base64,${payload}` },
  };
}

// `bytes` is a binary string (one char per byte), as returned by atob().
function detectMimeType(bytes: string): string | null {
  if (bytes.startsWith('\x89PNG\r\n\x1a\n')) return 'image/png';
  if (bytes.startsWith('\xff\xd8\xff')) return 'image/jpeg';
  if (bytes.startsWith('GIF87a') || bytes.startsWith('GIF89a')) return 'image/gif';
  if (bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP') return 'image/webp';
  if (bytes.slice(4, 12) === 'ftypavif' || bytes.slice(4, 12) === 'ftypavis') return 'image/avif';
  if (bytes.startsWith('BM')) return 'image/bmp';
  if (bytes.startsWith('\x00\x00\x01\x00')) return 'image/x-icon';

  const head = bytes.slice(0, 1024);
  if (/^(\xef\xbb\xbf)?\s*</.test(head) && head.includes('<svg')) return 'image/svg+xml';

  return null;
}
