import { useState } from 'react';
import type { DecodedImage } from './decoders/base64Image';

type Props = {
  image: DecodedImage;
  onError: () => void;
};

type Dimensions = { width: number; height: number };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImagePreview({ image, onError }: Props) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  return (
    <figure className="preview">
      <div className="preview-canvas">
        {/* Rendering through <img> keeps SVG scripts from running. */}
        <img
          src={image.dataUrl}
          alt="Decoded image preview"
          onLoad={(e) =>
            setDimensions({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            })
          }
          onError={onError}
        />
      </div>
      <dl className="details">
        <dt>Type</dt>
        <dd>{image.mimeType}</dd>
        <dt>Size</dt>
        <dd>{formatBytes(image.byteLength)}</dd>
        <dt>Dimensions</dt>
        <dd>{dimensions ? `${dimensions.width} × ${dimensions.height} px` : '…'}</dd>
      </dl>
    </figure>
  );
}
