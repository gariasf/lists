#!/usr/bin/env node
/**
 * Generate the Figma Community listing assets at the exact sizes Figma wants:
 * cover 1920x1080, icon 128x128. Run from the repo root:
 *   node packages/figma-plugin/make-listing-assets.mjs
 * Uses the sharp already in the site's devDependencies — nothing new to install.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "listing");
await fs.mkdir(OUT, { recursive: true });

// 128x128 icon, downscaled from the site's own 512 mark so the plugin and the
// site read as the same product.
await sharp(path.join(HERE, "..", "..", "public", "icon-512.png"))
  .resize(128, 128)
  .png()
  .toFile(path.join(OUT, "icon-128.png"));

// Cover: the plugin's actual promise, shown as before/after text layers.
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <style>
      .t { font-family: 'Helvetica Neue', Arial, sans-serif; }
      .h { font-size: 92px; font-weight: 800; letter-spacing: -3px; fill: #20261F; }
      .s { font-size: 38px; font-weight: 400; fill: #68705F; }
      .lbl { font-size: 20px; font-weight: 700; letter-spacing: 3px; fill: #9AA18D; }
      .row { font-size: 34px; font-weight: 500; fill: #20261F; }
      .ghost { font-size: 34px; font-weight: 500; fill: #C3C8BB; }
      .chip { font-size: 24px; font-weight: 600; fill: #1A7A4A; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#FBFBF8"/>

  <text x="140" y="230" class="t h">Fill text layers with</text>
  <text x="140" y="330" class="t h">data that looks real.</text>
  <text x="142" y="400" class="t s">431 curated lists · names, cities, microcopy, UI states</text>

  <!-- before -->
  <text x="142" y="540" class="t lbl">BEFORE</text>
  <rect x="140" y="570" width="700" height="330" rx="18" fill="#FFFFFF" stroke="#E3E5DC" stroke-width="2"/>
  ${["Text", "Text", "Text", "Text", "Text"]
    .map((t, i) => `<text x="180" y="${632 + i * 58}" class="t ghost">${t}</text>`)
    .join("\n  ")}

  <!-- after -->
  <text x="1082" y="540" class="t lbl">AFTER</text>
  <rect x="1080" y="570" width="700" height="330" rx="18" fill="#FFFFFF" stroke="#1A7A4A" stroke-width="2"/>
  ${["Ana Beatriz Souza", "João Pedro Oliveira", "Larissa Cavalcanti", "Rafael Nascimento", "Mariana Costa"]
    .map((t, i) => `<text x="1120" y="${632 + i * 58}" class="t row">${t}</text>`)
    .join("\n  ")}

  <text x="1082" y="960" class="t chip">Select layers → pick a list → Fill</text>
</svg>`;

await sharp(Buffer.from(cover)).png().toFile(path.join(OUT, "cover-1920x1080.png"));

for (const f of ["icon-128.png", "cover-1920x1080.png"]) {
  const meta = await sharp(path.join(OUT, f)).metadata();
  console.log(`${f}: ${meta.width}x${meta.height}`);
}
