/**
 * generate-pwa-icons.mjs
 *
 * Generates icon-192.png and icon-512.png from the SVG source using
 * the @resvg/resvg-js package (pure WASM, no native binaries, works on Vercel).
 * Falls back gracefully if the package is unavailable.
 *
 * Usage (added to package.json as "prebuild"):
 *   node scripts/generate-pwa-icons.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dirname, '..');
const ICONS    = join(ROOT, 'public', 'icons');

if (!existsSync(ICONS)) mkdirSync(ICONS, { recursive: true });

// Read SVG sources
const svg192 = readFileSync(join(ICONS, 'icon-192.svg'), 'utf8');
const svg512 = readFileSync(join(ICONS, 'icon-512.svg'), 'utf8');

async function generatePng(svgSource, size, outPath) {
  try {
    // Try @resvg/resvg-js first (zero native deps, pure WASM)
    const { Resvg } = await import('@resvg/resvg-js');
    const resvg = new Resvg(svgSource, {
      fitTo: { mode: 'width', value: size },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    writeFileSync(outPath, pngBuffer);
    console.log(`✅ Generated ${outPath} (${size}×${size}px)`);
  } catch (err) {
    // Fallback: try sharp
    try {
      const { default: sharp } = await import('sharp');
      await sharp(Buffer.from(svgSource))
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`✅ Generated ${outPath} via sharp (${size}×${size}px)`);
    } catch {
      console.warn(
        `⚠️  Could not generate ${size}px PNG (neither @resvg/resvg-js nor sharp available).\n` +
        `   The SVG icons will still be used — install prompt may not appear on Chrome < 87.\n` +
        `   To fix: npm install --save-dev @resvg/resvg-js`
      );
    }
  }
}

await generatePng(svg192, 192, join(ICONS, 'icon-192.png'));
await generatePng(svg512, 512, join(ICONS, 'icon-512.png'));
