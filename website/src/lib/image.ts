/**
 * Shared LQIP for `next/image` `placeholder="blur"` on remote (Supabase
 * Storage) images. We have no per-image blur hash — Storage does not generate
 * one at upload — so this is a solid 8×6 PNG tinted to `bg-primary-50`
 * (#EEF0FF), the same colour the card/hero image containers use. It removes the
 * white flash before an image paints without pretending to be a real preview.
 *
 * (A true LQIP would need a blur hash produced at upload time or a build step —
 * not worth it for a solid tint.)
 */
export const IMAGE_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAEUlEQVR42mN49+E/VsQwkBIAQ46JccxObJYAAAAASUVORK5CYII=";
