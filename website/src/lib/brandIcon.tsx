// Single source for the brand mark used as the site favicon (bg-primary
// #4F39F6 rounded tile, white bold "C" — same mark as Header.tsx). Shared by
// app/icon.tsx (the <link rel="icon"> Next generates) and
// app/favicon.ico/route.ts (the compatibility path some crawlers/browsers
// request directly) so both stay in sync and no new artwork is introduced.
export const BRAND_ICON_SIZE = { width: 32, height: 32 };

export function BrandIconMark() {
  return (
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
  );
}
