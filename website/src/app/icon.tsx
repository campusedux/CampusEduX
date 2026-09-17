import { ImageResponse } from "next/og";

// Renders the same brand mark used in the live header (Header.tsx: bg-primary
// #4F39F6 rounded tile, white bold "C") as the site favicon. No new artwork —
// this is the one brand mark that already exists in the codebase, since there
// is no raster/vector logo file anywhere in the repo to reuse instead.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4F39F6",
          borderRadius: 7,
          color: "#fff",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
