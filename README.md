# qr-forge

In-browser QR studio: live preview, palettes, shape masks, logo overlay, PNG/SVG/JPEG export.

Live: [qr.undivisible.dev](https://qr.undivisible.dev)

Moonshine (React) on Cloudflare Workers. ISC license — see [LICENSE](LICENSE).

## Setup

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

| Script | Runs | Purpose |
| --- | --- | --- |
| `bun run dev` | `moonshine dev` | local dev server |
| `bun run build` | `moonshine build --adapter cloudflare` | production build into `.moonshine/` |
| `bun run preview` | `moonshine preview` | serve that build locally |
| `bun run typecheck` | `tsc --noEmit` | typecheck the source |
