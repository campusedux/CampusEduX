/**
 * Client-side image helpers shared by <ImageUploader />.
 *
 * - `validateImageFile` — MIME + extension + size gate (JPG / PNG / WebP only).
 * - `compressImage` — downscales to a sane max edge and re-encodes to WebP so
 *   we never push a 6 MB phone photo into Storage or down to a card in the app.
 *   Falls back to the original file whenever the canvas path can't do better
 *   (tiny images, decode failure, WebP unsupported, or a larger result).
 *
 * Nothing here touches the network — the upload itself lives in the component.
 */

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** For the file picker's `accept=` and drag-drop hints. */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export const DEFAULT_MAX_IMAGE_MB = 6;

export interface CompressOptions {
  /** Longest edge, in px, after downscale. Default 1600. */
  maxEdge?: number;
  /** WebP quality 0–1. Default 0.82. */
  quality?: number;
}

export interface PreparedImage {
  blob: Blob;
  /** file extension without the dot, e.g. `webp` / `png` */
  ext: string;
  contentType: string;
  /** true when compression actually ran (vs. passing the original through) */
  compressed: boolean;
}

type ValidateResult = { ok: true } | { ok: false; error: string };

export function validateImageFile(file: File, maxMB = DEFAULT_MAX_IMAGE_MB): ValidateResult {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const extOk = /\.(jpe?g|png|webp)$/.test(name);
  const typeOk = (ALLOWED_IMAGE_MIME as readonly string[]).includes(type);

  // Some browsers hand us an empty type for drag-drop — fall back to the name.
  if (!typeOk && !(type === '' && extOk)) {
    return { ok: false, error: 'Use a JPG, PNG or WebP image.' };
  }
  if (typeOk && !extOk && type !== 'image/jpeg') {
    // jpeg legitimately comes as .jpg/.jpeg — both matched above.
    return { ok: false, error: 'File extension does not match an image type.' };
  }
  if (file.size > maxMB * 1024 * 1024) {
    return { ok: false, error: `Image is larger than ${maxMB} MB. Pick a smaller file.` };
  }
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty.' };
  }
  return { ok: true };
}

function extFor(contentType: string): string {
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/png') return 'png';
  return 'jpg';
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      close: () => bmp.close(),
    };
  }
  // Safari < 15 etc.: fall back to an <img> + object URL.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Returns a Storage-ready blob. Best-effort: on any failure it just returns the
 * original file so an upload never gets blocked by the optimiser.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<PreparedImage> {
  const maxEdge = opts.maxEdge ?? 1600;
  const quality = opts.quality ?? 0.82;
  const passthrough = (): PreparedImage => ({
    blob: file,
    ext: extFor(file.type || 'image/jpeg'),
    contentType: file.type || 'image/jpeg',
    compressed: false,
  });

  if (typeof document === 'undefined') return passthrough();

  let bmp: Awaited<ReturnType<typeof loadBitmap>> | null = null;
  try {
    bmp = await loadBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const targetW = Math.max(1, Math.round(bmp.width * scale));
    const targetH = Math.max(1, Math.round(bmp.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return passthrough();
    ctx.imageSmoothingQuality = 'high';
    bmp.draw(ctx, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') return passthrough();

    // Only keep the re-encode if it's actually smaller (or we downscaled).
    if (blob.size >= file.size && scale === 1) return passthrough();
    return { blob, ext: 'webp', contentType: 'image/webp', compressed: true };
  } catch {
    return passthrough();
  } finally {
    bmp?.close();
  }
}

/** `2f9c1a-1712345678.webp` — collision-safe object key segment. */
export function randomImageKey(ext: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${rand}-${Date.now()}.${ext}`;
}
