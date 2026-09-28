#!/usr/bin/env node
// Generates every CampusEduX logo / icon / favicon variant for the website and
// the mobile app from ONE master file:
//
//   mobile-app/assets/icon-original.png  (1254x1254, logo on a white rounded
//                                         square with solid black corners)
//
// The logo is never redrawn or recoloured — only cropped, resized, padded and
// its white card background removed. The black corners sit outside every crop
// window, so they cannot reach any output.
//
// Run from the repo root (sharp is a devDependency of website/):
//   node scripts/generate-logos.mjs
//
// Re-run after replacing the master; outputs are overwritten in place.

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(join(ROOT, "website/package.json"))("sharp");

const MASTER = join(ROOT, "mobile-app/assets/icon-original.png");
const MOBILE = join(ROOT, "mobile-app/assets");
const WEB_PUBLIC = join(ROOT, "website/public/brand");
const WEB_APP = join(ROOT, "website/src/app");
const WEB_LIB = join(ROOT, "website/src/lib");

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// ---------------------------------------------------------------------------
// Master analysis
// ---------------------------------------------------------------------------

// Inside this window the master is only the white card and the logo — the
// rounded corners (and their black fill) are all outside it.
const SAFE = { x0: 60, y0: 110, x1: 1194, y1: 1110 };
// Vertical bands of the master: CX mark, "CampusEduX" wordmark, tagline.
const BANDS = { mark: [110, 873], word: [873, 1044], tag: [1044, 1110] };

// A pixel's distance from white (0 = pure white card, 255 = fully saturated).
// Every logo colour is >= ~0.85 * 255 away from white, so anything between the
// noise floor and that is an anti-aliased edge blended with the white card.
const NOISE = 18;
const SOLID = Math.round(0.85 * 255);

function alphaOf(r, g, b) {
  const d = 255 - Math.min(r, g, b);
  if (d <= NOISE) return 0;
  if (d >= SOLID) return 1;
  return (d - NOISE) / (SOLID - NOISE);
}

async function loadMaster() {
  const { data, info } = await sharp(MASTER).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width < SAFE.x1 || info.height < SAFE.y1) {
    throw new Error(`Master is ${info.width}x${info.height}; expected ~1254x1254.`);
  }
  return { data, width: info.width };
}

/** Tight bounding box of logo pixels inside a band of the master. */
function bbox(master, [y0, y1]) {
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  for (let y = Math.max(y0, SAFE.y0); y < Math.min(y1, SAFE.y1); y++) {
    for (let x = SAFE.x0; x < SAFE.x1; x++) {
      const i = (y * master.width + x) * 3;
      if (alphaOf(master.data[i], master.data[i + 1], master.data[i + 2]) > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`No logo pixels in band ${y0}-${y1}.`);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Crop a box of the master to RGBA, turning the white card transparent
 * ("colour to alpha" against white: edge pixels get partial alpha and their
 * colour un-blended from white, so no white fringe on dark backgrounds).
 * `silhouette` keeps only the alpha and paints every pixel `silhouette`.
 */
function cutout(master, box, silhouette = null) {
  const out = Buffer.alloc(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const i = ((box.y + y) * master.width + box.x + x) * 3;
      const o = (y * box.w + x) * 4;
      const [r, g, b] = [master.data[i], master.data[i + 1], master.data[i + 2]];
      const a = alphaOf(r, g, b);
      if (a === 0) continue;
      const rgb = silhouette ?? [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(255 - (255 - c) / a))));
      out[o] = rgb[0];
      out[o + 1] = rgb[1];
      out[o + 2] = rgb[2];
      out[o + 3] = Math.round(a * 255);
    }
  }
  return { buf: out, w: box.w, h: box.h };
}

const img = ({ buf, w, h }) => sharp(buf, { raw: { width: w, height: h, channels: 4 } });

/** Resize an RGBA cutout so it fits a w x h box (never distorts). */
async function fitTo(cut, w, h) {
  const { data, info } = await img(cut)
    .resize(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), { fit: "inside", kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { buf: data, w: info.width, h: info.height };
}

/** Place a cutout centred on a size x size (or w x h) canvas. */
async function canvas(cut, width, height, background) {
  const png = await img(cut).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background } }).composite([
    { input: png, left: Math.round((width - cut.w) / 2), top: Math.round((height - cut.h) / 2) },
  ]);
}

/** Square canvas with the cutout's bounding box using `fill` of the side. */
async function square(cut, size, fill, background) {
  const s = (size * fill) / Math.max(cut.w, cut.h);
  return canvas(await fitTo(cut, cut.w * s, cut.h * s), size, size, background);
}

/**
 * Square canvas where every visible pixel stays within `radius` (fraction of
 * the side) of the centre — for launcher masks (Android adaptive circle,
 * PWA maskable) that crop to a circle.
 */
async function radialSquare(cut, size, radius, background) {
  let far = 0;
  for (let y = 0; y < cut.h; y++) {
    for (let x = 0; x < cut.w; x++) {
      if (cut.buf[(y * cut.w + x) * 4 + 3] > 8) {
        far = Math.max(far, Math.hypot(x + 0.5 - cut.w / 2, y + 0.5 - cut.h / 2));
      }
    }
  }
  const s = (size * radius) / far;
  return canvas(await fitTo(cut, cut.w * s, cut.h * s), size, size, background);
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const written = [];

async function save(pipeline, file, { flatten = false, webp = false } = {}) {
  await mkdir(dirname(file), { recursive: true });
  // Materialise first: sharp can't chain resize/flatten after composite().
  let p = sharp(await pipeline.png().toBuffer());
  if (flatten) p = p.flatten({ background: WHITE }).removeAlpha();
  const png = await p.png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
  await writeFile(file, png);
  written.push(file);
  if (webp) {
    const out = file.replace(/\.png$/, ".webp");
    await writeFile(out, await sharp(png).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer());
    written.push(out);
  }
  return png;
}

/** Multi-size .ico whose entries are PNGs (supported by every current browser). */
async function writeIco(file, pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  for (const [n, { size, png }] of pngs.entries()) {
    const e = 6 + n * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  }
  await writeFile(file, Buffer.concat([header, ...pngs.map((p) => p.png)]));
  written.push(file);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function main() {
  const master = await loadMaster();
  const pad = (b, n) => ({ x: b.x - n, y: b.y - n, w: b.w + 2 * n, h: b.h + 2 * n });

  const markBox = pad(bbox(master, BANDS.mark), 2);
  const wordBox = pad(bbox(master, BANDS.word), 2);
  const tagBox = bbox(master, BANDS.tag);
  const fullBox = pad(
    {
      x: Math.min(markBox.x, wordBox.x, tagBox.x),
      y: markBox.y,
      w: Math.max(markBox.x + markBox.w, wordBox.x + wordBox.w, tagBox.x + tagBox.w) - Math.min(markBox.x, wordBox.x, tagBox.x),
      h: tagBox.y + tagBox.h - markBox.y,
    },
    2,
  );

  const mark = cutout(master, markBox);
  const word = cutout(master, wordBox);
  const full = cutout(master, fullBox);
  const markWhite = cutout(master, markBox, [255, 255, 255]);

  // --- Shared variants ------------------------------------------------------

  // 1. Full logo, transparent, trimmed (native resolution + even 3% padding).
  const fullPad = Math.round(full.h * 0.03);
  const logoFull = await canvas(full, full.w + 2 * fullPad, full.h + 2 * fullPad, CLEAR);

  // 2. Mark only, square 1024, transparent, even padding.
  const logoMark = await square(mark, 1024, 0.86, CLEAR);

  // 3. Horizontal lock-up: mark left, wordmark right, cut from the master.
  //    Wordmark stays at native size; the mark is scaled to 1.9x its height.
  //    The text is vertically centred on its cap height (baseline = lowest
  //    pixel of the non-descending first quarter: "Cam"), not on the "p" tail.
  let baseline = 0;
  for (let y = 0; y < word.h; y++) {
    for (let x = 0; x < Math.floor(word.w / 4); x++) {
      if (word.buf[(y * word.w + x) * 4 + 3] > 128) baseline = Math.max(baseline, y);
    }
  }
  const markH = Math.round(word.h * 1.9);
  const markSmall = await fitTo(mark, mark.w * (markH / mark.h), markH);
  const gap = Math.round(markH * 0.14);
  const hPad = Math.round(markH * 0.06);
  const hWidth = markSmall.w + gap + word.w + 2 * hPad;
  const hHeight = markSmall.h + 2 * hPad;
  const wordTop = Math.round(hPad + markSmall.h / 2 - baseline / 2);
  const horizontal = sharp({ create: { width: hWidth, height: hHeight, channels: 4, background: CLEAR } }).composite([
    { input: await img(markSmall).png().toBuffer(), left: hPad, top: hPad },
    { input: await img(word).png().toBuffer(), left: hPad + markSmall.w + gap, top: wordTop },
  ]);
  const horizontalPng = await horizontal.png().toBuffer();
  const horizontalMeta = await sharp(horizontalPng).metadata();

  // 4. Full logo on solid white, square — social sharing.
  const fullWhite = await square(full, 1200, 0.8, WHITE);

  // --- Website ----------------------------------------------------------------

  await save(sharp(await logoFull.png().toBuffer()), join(WEB_PUBLIC, "logo-full.png"), { webp: true });
  await save(sharp(await logoMark.png().toBuffer()).resize(512, 512), join(WEB_PUBLIC, "logo-mark.png"), { webp: true });
  await save(sharp(horizontalPng), join(WEB_PUBLIC, "logo-wordmark-horizontal.png"), { webp: true });
  await save(fullWhite, join(WEB_PUBLIC, "logo-full-white-bg.png"), { flatten: true, webp: true });

  // Open Graph 1200x630: full logo centred on white.
  await save(await canvas(await fitTo(full, 1100, 630 * 0.8), 1200, 630, WHITE), join(WEB_PUBLIC, "og-image.png"), {
    flatten: true,
  });

  // Manifest icons: "any" (transparent) + maskable (white, circle safe zone r=40%).
  await save(await square(mark, 192, 0.9, CLEAR), join(WEB_PUBLIC, "icon-192.png"));
  await save(await square(mark, 512, 0.9, CLEAR), join(WEB_PUBLIC, "icon-512.png"));
  await save(await radialSquare(mark, 512, 0.38, WHITE), join(WEB_PUBLIC, "icon-maskable-512.png"), { flatten: true });

  // Next.js app-dir file conventions.
  await save(await square(mark, 32, 0.96, CLEAR), join(WEB_APP, "icon.png"));
  await save(await square(mark, 180, 0.8, WHITE), join(WEB_APP, "apple-icon.png"), { flatten: true });
  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, png: await (await square(mark, size, 0.98, CLEAR)).png().toBuffer() });
  }
  await writeIco(join(WEB_APP, "favicon.ico"), icoEntries);

  // Per-page Open Graph cards (lib/ogImage.tsx) embed the horizontal logo as a
  // data URL so the image route never depends on reading public/ at runtime.
  const ogLogoHeight = 144;
  const ogLogo = await sharp(horizontalPng)
    .resize({ height: ogLogoHeight })
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toBuffer();
  const ogLogoMeta = await sharp(ogLogo).metadata();
  const dataFile = join(WEB_LIB, "brandLogoData.ts");
  await writeFile(
    dataFile,
    `// GENERATED by scripts/generate-logos.mjs — do not edit by hand.\n` +
      `// Horizontal CampusEduX logo (mark + wordmark) for the per-page Open Graph\n` +
      `// cards rendered by lib/ogImage.tsx.\n` +
      `export const BRAND_LOGO_HORIZONTAL = {\n` +
      `  src: "data:image/png;base64,${ogLogo.toString("base64")}",\n` +
      `  width: ${ogLogoMeta.width},\n` +
      `  height: ${ogLogoMeta.height},\n` +
      `} as const;\n`,
  );
  written.push(dataFile);

  // Public paths + native pixel sizes for next/image (header/footer, manifest).
  const sizeOf = async (name) => {
    const m = await sharp(join(WEB_PUBLIC, name)).metadata();
    return `{ src: "/brand/${name}", width: ${m.width}, height: ${m.height} }`;
  };
  const assetsFile = join(WEB_LIB, "brandAssets.ts");
  await writeFile(
    assetsFile,
    `// GENERATED by scripts/generate-logos.mjs — do not edit by hand.\n` +
      `// Public paths and native pixel sizes of the CampusEduX logo files in public/brand/.\n` +
      `export const BRAND_ASSETS = {\n` +
      `  logoFull: ${await sizeOf("logo-full.png")},\n` +
      `  logoMark: ${await sizeOf("logo-mark.png")},\n` +
      `  logoHorizontal: ${await sizeOf("logo-wordmark-horizontal.png")},\n` +
      `  ogImage: ${await sizeOf("og-image.png")},\n` +
      `} as const;\n`,
  );
  written.push(assetsFile);

  // --- Mobile app ---------------------------------------------------------------

  // App icon: mark on solid white, no alpha, no pre-rounded corners.
  await save(await square(mark, 1024, 0.8, WHITE), join(MOBILE, "icon.png"), { flatten: true });
  // Android adaptive foreground + monochrome: inside the 66dp-of-108dp circle.
  await save(await radialSquare(mark, 1024, 0.3, CLEAR), join(MOBILE, "adaptive-icon.png"));
  await save(await radialSquare(markWhite, 1024, 0.3, CLEAR), join(MOBILE, "monochrome-icon.png"));
  // Splash (expo-splash-screen): full logo with tagline, transparent square.
  await save(await square(full, 1024, 0.98, CLEAR), join(MOBILE, "splash-icon.png"));
  // Expo web favicon.
  await save(await square(mark, 48, 0.96, CLEAR), join(MOBILE, "favicon.png"));
  // Android notification small icon: white silhouette on transparent.
  await save(await square(markWhite, 96, 0.84, CLEAR), join(MOBILE, "notification-icon.png"));
  // In-app brand images (sized ~3x their largest on-screen use).
  await save(sharp(await logoFull.png().toBuffer()).resize({ width: 720 }), join(MOBILE, "brand/logo-full.png"));
  await save(sharp(await logoMark.png().toBuffer()).resize(384, 384), join(MOBILE, "brand/logo-mark.png"));
  await save(sharp(horizontalPng).resize({ height: 144 }), join(MOBILE, "brand/logo-wordmark-horizontal.png"));

  console.log(`master ${relative(ROOT, MASTER)}`);
  console.log(`crops  mark ${JSON.stringify(markBox)} word ${JSON.stringify(wordBox)} full ${JSON.stringify(fullBox)}`);
  console.log(`horizontal ${horizontalMeta.width}x${horizontalMeta.height}`);
  for (const f of written) console.log(`wrote  ${relative(ROOT, f)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
