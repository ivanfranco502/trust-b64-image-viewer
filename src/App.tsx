import { useEffect, useState } from 'react';
import { decode, type DecodedImage } from './decoders/base64Image';
import ImagePreview from './ImagePreview';

const REPO_URL = 'https://github.com/ivanfranco502/trust-b64-image-viewer';
const COMMIT_SHA = __COMMIT_SHA__;
const SHORT_SHA = COMMIT_SHA.slice(0, 7);
const COMMIT_URL = `${REPO_URL}/commit/${COMMIT_SHA}`;

const RENDER_ERROR =
  'The browser cannot display this image. The data may be corrupt or truncated, or the type may be wrong.';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (mql?.matches) return 'dark';
  } catch {
    // localStorage / matchMedia unavailable — fall through
  }
  return 'light';
}

export default function App() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<DecodedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handlePreview = () => {
    const result = decode(input);
    if (result.ok) {
      setError(null);
      setImage(result.value);
    } else {
      setError(result.error);
      setImage(null);
    }
  };

  const handleRenderError = () => {
    setError(RENDER_ERROR);
    setImage(null);
  };

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Trust B64 Image Viewer</h1>
          <p className="subtitle">Base64 image preview</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <label htmlFor="input">Input</label>
      <textarea
        id="input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        placeholder="Paste raw base64 image data or a data:image/...;base64,... URI"
      />

      <div className="actions">
        <button type="button" onClick={handlePreview}>
          Preview
        </button>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {image && <ImagePreview key={image.dataUrl} image={image} onError={handleRenderError} />}

      <footer className="footer">
        Built from commit{' '}
        <a href={COMMIT_URL} target="_blank" rel="noreferrer noopener">
          {SHORT_SHA}
        </a>
      </footer>
    </main>
  );
}
