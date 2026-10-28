# trust-b64-image-viewer

Small React app that previews a base64-encoded image. Paste raw base64 or a `data:image/...;base64,...` URI, click **Preview**, and see the image with its type, size, and dimensions. Everything runs in the browser — nothing is uploaded or stored (only the light/dark theme choice is kept in `localStorage`). Built with Vite + TypeScript, tested with Vitest + React Testing Library, deployed to GitHub Pages.

Live: https://ivanfranco502.github.io/trust-b64-image-viewer/

## Supported input

- **Data URI** (`data:image/png;base64,...`): the declared type is used as-is.
- **Raw base64**: the type is detected from the first bytes. Detected formats: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, SVG. For anything else, add a data URI prefix.

Whitespace and line breaks are ignored, and `=` padding is optional.

## Develop

Requires Node 24 and [pnpm](https://pnpm.io/). The pnpm version is pinned in `package.json` via the `packageManager` field — `corepack enable` will pick it up automatically.

```bash
pnpm install
pnpm dev          # http://localhost:5173/trust-b64-image-viewer/
pnpm test         # watch mode
pnpm test:run     # single run (used by CI)
pnpm typecheck
pnpm build
pnpm preview
```

## CI / Deploy

- `.github/workflows/ci.yml` runs typecheck, tests, and build on every pull request.
- `.github/workflows/deploy.yml` re-runs the same checks on `main` and deploys `dist/` to GitHub Pages via `actions/deploy-pages`.

### One-time repo setup

1. **Settings → Pages**: set **Source** to **GitHub Actions**.
2. **Settings → Branches**: add a protection rule on `main` requiring the `ci / typecheck, test, build` check to pass before merging.

## Code layout

`src/decoders/base64Image.ts` exposes `decode(input)`, which parses and validates the input and returns a `DecodeResult` (`{ ok: true, value }` or `{ ok: false, error }`). `src/ImagePreview.tsx` renders the image and its details. The image is always rendered through `<img>`, so scripts inside an SVG do not run.
