# Lists — Figma plugin

Fills selected text layers with realistic mock data from
[lists.gariasf.com](https://lists.gariasf.com). Search 430+ lists, click one,
hit **Fill layers**. **Shuffle** re-rolls with a different sample.

Layers fill in reading order (top to bottom, then left to right), not
selection order, so a filled table or list reads the way the layout does.
Selecting a frame fills every text layer inside it.

## Running it

No build step — it's plain JS and one HTML file.

1. Figma → **Plugins → Development → Import plugin from manifest…**
2. Pick `manifest.json` in this folder.
3. It now appears under Plugins → Development → *Lists — realistic mock data*.

## How it works

The plugin sandbox can't make network requests, so the UI iframe fetches
`/api/manifest` and `/api/sample/<slug>?n=…` and posts the items to the main
thread, which writes them into the selection. Fonts are loaded per node
before `characters` is set — a layer whose font isn't available is skipped
and counted rather than failing the whole fill.

Only `https://lists.gariasf.com` is in `networkAccess.allowedDomains`.

## Publishing to the Figma Community

Not done — publishing needs a Figma account with publish rights, a cover
image, and their review. Everything else (manifest, network declaration,
icon-free UI) is ready to submit as-is.
