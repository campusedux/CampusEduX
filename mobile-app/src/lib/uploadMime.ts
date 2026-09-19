/**
 * Upload content types. The Storage buckets (migration 0117/089) carry `allowed_mime_types` and
 * reject anything else - including `application/octet-stream`, which pickers return for some
 * Android providers and which `fetch(file://).blob()` often reports. Storage checks the type of
 * the uploaded BODY (a Blob's own `.type`; the `contentType` option is ignored for Blobs), so
 * uploads send an ArrayBuffer together with a type resolved here from the mime the picker gave
 * OR, when that is missing/generic, from the file extension.
 *
 * tests/unit/lib/uploadLimits.test.ts fails if these lists drift from the bucket SQL.
 */

/** Must equal the `avatars` bucket file_size_limit (2 MB, migration 0117/089). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
/** Must equal the `custom-project-uploads` bucket file_size_limit (15 MB) and the website's CP_MAX_FILE_MB. */
export const CUSTOM_UPLOAD_MAX_MB = 15;
export const CUSTOM_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
] as const;
export const CUSTOM_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extensionOf(nameOrUri: string): string {
  const clean = nameOrUri.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot === -1 ? "" : clean.slice(dot + 1).toLowerCase();
}

export function mimeFromName(nameOrUri: string): string | null {
  return EXT_TO_MIME[extensionOf(nameOrUri)] ?? null;
}

/** File extension (no dot) for an image content type. */
export function extensionForImageMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? "jpg";
}

/**
 * The content type to upload with: the picker's/blob's own mime when it is in `allowed`, else the
 * extension-derived type when THAT is allowed, else null (caller should reject the file).
 */
export function resolveContentType(
  file: { name?: string | null; uri?: string | null; mimeType?: string | null; hintType?: string | null },
  allowed: readonly string[],
): string | null {
  for (const own of [file.mimeType, file.hintType]) {
    const m = (own ?? "").toLowerCase();
    if (m && allowed.includes(m)) return m;
  }
  for (const src of [file.name, file.uri]) {
    if (!src) continue;
    const derived = mimeFromName(src);
    if (derived && allowed.includes(derived)) return derived;
  }
  return null;
}

/**
 * Reads a local file into an ArrayBuffer (the Supabase-documented Expo pattern), so the
 * `contentType` option is what actually gets sent. `hintType` is the response Content-Type, only a hint.
 */
export async function readFileBody(uri: string): Promise<{ body: ArrayBuffer; hintType: string; size: number }> {
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  return { body, hintType: response.headers?.get?.("content-type") ?? "", size: body.byteLength };
}
