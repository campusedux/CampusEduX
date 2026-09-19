// Upload content-type helpers.
//
// Supabase Storage validates the type of the uploaded BODY against the bucket's
// `allowed_mime_types` (migration 0117/089). For a Blob/File body storage-js sends it as a
// multipart part and IGNORES the `contentType` upload option, so the File's own `.type` is what
// counts — and browsers often leave it empty (.docx/.zip on Windows) or generic. We therefore
// (1) resolve the correct type from the extension when `.type` is missing/generic and
// (2) re-type the Blob before uploading, so a real upload never carries octet-stream.

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** MIME type implied by the file extension, or null when unknown. */
export function mimeFromFileName(name: string): string | null {
  return EXT_TO_MIME[extensionOf(name)] ?? null;
}

/**
 * The content type to upload `file` with: its own `.type` when that is one of `allowed`,
 * otherwise the extension-derived type when THAT is allowed, otherwise null (reject the file).
 */
export function resolveUploadContentType(
  file: { name: string; type?: string | null },
  allowed: readonly string[],
): string | null {
  const own = (file.type ?? "").toLowerCase();
  if (own && allowed.includes(own)) return own;
  const derived = mimeFromFileName(file.name);
  return derived && allowed.includes(derived) ? derived : null;
}

/** The same bytes as `file`, typed as `contentType` (what storage-js will actually send). */
export function withContentType(file: Blob, contentType: string): Blob {
  return file.type === contentType ? file : file.slice(0, file.size, contentType);
}
