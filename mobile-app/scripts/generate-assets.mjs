// Generates the placeholder app icons / splash used by app.json, in the
// CampusEduX purple/rocket branding from the Splash screen mockup
// (bg #4F39F6, rocket in #FBBF24 + white). Zero dependencies — hand-rolled
// RGBA -> PNG via Node's zlib.
//
//   node scripts/generate-assets.mjs
//
// Outputs: assets/icon.png, assets/adaptive-icon.png, assets/splash.png,
//          assets/favicon.png

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets");
mkdirSync(OUT, { recursive: true });

const PURPLE = [0x4f, 0x39, 0xf6];
const DEEP = [0x31, 0x2e, 0x81];
const AMBER = [0xfb, 0xbf, 0x24];
const ORANGE = [0xfb, 0x92, 0x3c];
const WHITE = [0xff, 0xff, 0xff];

// ---------------------------------------------------------------- tiny canvas
function makeCanvas(w, h, bg /* [r,g,b] | null for transparent */) {
  const px = new Uint8Array(w * h * 4);
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      px[i * 4] = bg[0];
      px[i * 4 + 1] = bg[1];
      px[i * 4 + 2] = bg[2];
      px[i * 4 + 3] = 255;
    }
  }
  const set = (x, y, c) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    px[i] = c[0];
    px[i + 1] = c[1];
    px[i + 2] = c[2];
    px[i + 3] = 255;
  };
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.round(y0); y < y1; y++) for (let x = Math.round(x0); x < x1; x++) set(x, y, c);
  };
  const disc = (cx, cy, r, c) => {
    for (let y = Math.round(cy - r); y <= cy + r; y++)
      for (let x = Math.round(cx - r); x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, c);
  };
  const tri = (ax, ay, bx, by, cx, cy, c) => {
    const minX = Math.floor(Math.min(ax, bx, cx));
    const maxX = Math.ceil(Math.max(ax, bx, cx));
    const minY = Math.floor(Math.min(ay, by, cy));
    const maxY = Math.ceil(Math.max(ay, by, cy));
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (area === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / area;
        const w1 = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= -0.001 && w1 >= -0.001 && w2 >= -0.001) set(x, y, c);
      }
    }
  };
  const capsule = (cx, top, bottom, halfW, c) => {
    rect(cx - halfW, top + halfW, cx + halfW, bottom - halfW, c);
    disc(cx, top + halfW, halfW, c);
    disc(cx, bottom - halfW, halfW, c);
  };
  return { w, h, px, set, rect, disc, tri, capsule };
}

// ------------------------------------------------------------- rocket drawing
function drawRocket(cv, cx, cy, H) {
  const bodyHalf = 0.19 * H;
  const bodyTop = cy - 0.30 * H;
  const bodyBottom = cy + 0.26 * H;
  // exhaust flame
  cv.tri(cx - 0.12 * H, bodyBottom - 0.02 * H, cx + 0.12 * H, bodyBottom - 0.02 * H, cx, cy + 0.52 * H, AMBER);
  cv.tri(cx - 0.06 * H, bodyBottom - 0.02 * H, cx + 0.06 * H, bodyBottom - 0.02 * H, cx, cy + 0.40 * H, ORANGE);
  // fins
  cv.tri(cx - bodyHalf, cy + 0.02 * H, cx - 0.40 * H, bodyBottom + 0.06 * H, cx - bodyHalf, bodyBottom, AMBER);
  cv.tri(cx + bodyHalf, cy + 0.02 * H, cx + 0.40 * H, bodyBottom + 0.06 * H, cx + bodyHalf, bodyBottom, AMBER);
  // body
  cv.capsule(cx, bodyTop, bodyBottom, bodyHalf, WHITE);
  // nose cone
  cv.tri(cx, cy - 0.60 * H, cx - bodyHalf, bodyTop + 0.06 * H, cx + bodyHalf, bodyTop + 0.06 * H, AMBER);
  // window
  cv.disc(cx, cy - 0.10 * H, 0.095 * H, PURPLE);
  cv.disc(cx, cy - 0.10 * H, 0.055 * H, DEEP);
}

// ------------------------------------------------------------------ PNG encode
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG({ w, h, px }) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    px.subarray(y * w * 4, (y + 1) * w * 4).forEach((b, i) => {
      raw[y * (1 + w * 4) + 1 + i] = b;
    });
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ----------------------------------------------------------------- the assets
function write(name, cv) {
  writeFileSync(join(OUT, name), encodePNG(cv));
  console.log("wrote assets/" + name);
}

// icon.png — 1024, full-bleed purple, rocket ~64% height
{
  const S = 1024;
  const cv = makeCanvas(S, S, PURPLE);
  drawRocket(cv, S / 2, S * 0.52, S * 0.62);
  write("icon.png", cv);
}
// adaptive-icon.png — 1024, transparent (Android masks it; bg is app.json's
// backgroundColor), rocket kept inside the ~66% safe zone
{
  const S = 1024;
  const cv = makeCanvas(S, S, null);
  drawRocket(cv, S / 2, S * 0.52, S * 0.46);
  write("adaptive-icon.png", cv);
}
// splash.png — 1242x2688, centred rocket on purple
{
  const W = 1242;
  const Hh = 2688;
  const cv = makeCanvas(W, Hh, PURPLE);
  drawRocket(cv, W / 2, Hh * 0.46, W * 0.42);
  write("splash.png", cv);
}
// favicon.png — 48
{
  const S = 48;
  const cv = makeCanvas(S, S, PURPLE);
  drawRocket(cv, S / 2, S * 0.52, S * 0.66);
  write("favicon.png", cv);
}
