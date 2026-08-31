import type { Config } from "tailwindcss";

/**
 * CampusEduX website design tokens — mirrors the mobile app
 * (`mobile-app/src/constants/theme.ts` + `mobile-app/tailwind.config.js`) so the
 * site reads as "the CampusEduX app opened in a browser".
 *
 * The app palette is the source of truth: indigo `#4F39F6` primary on a white
 * surface, soft low card shadows, rounded-2xl cards, system sans (the app loads
 * no custom font — only `monospace` for code).
 *
 * The legacy editorial tokens (`navy` / `paper` / `marigold` / `emerald` /
 * `slate`) are kept as ALIASES pointing at app-aligned values so the ~65 pages
 * that still use them keep rendering coherently during the P2–P7 migration.
 * They are removed in the final cleanup once every page uses the shared
 * component system.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ---- App palette (source of truth) --------------------------------
        primary: {
          DEFAULT: "#4F39F6",
          50: "#EEF0FF",
          100: "#E0E3FF",
          200: "#C7CBFE",
          300: "#A5A9FC",
          400: "#8480F9",
          500: "#4F39F6",
          600: "#4429EA",
          700: "#3A20CE",
          800: "#3730A3",
          900: "#312E81",
        },
        surface: "#F8F9FC",
        ink: {
          DEFAULT: "#111827", // textPrimary
          muted: "#6B7280", // textSecondary
          faint: "#9CA3AF", // textMuted
        },
        line: "#E5E7EB", // border
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#F59E0B",

        // ---- Legacy aliases (interim — see file header) -------------------
        navy: "#111827", // was #12213D → app ink
        paper: "#FFFFFF", // was #F5F6F2 → app white surface
        slate: "#6B7280", // app secondary text
        marigold: { DEFAULT: "#F59E0B", deep: "#D97706" }, // app amber / "Premium" accent
        "marigold-deep": "#D97706",
        emerald: "#16A34A", // app success green / "Best seller"
      },
      fontFamily: {
        // The app uses the platform system font. Both families resolve to the
        // same stack so the 118 legacy `font-serif` usages lose the serif
        // without a file-by-file sweep.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        serif: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        // App scale: sm 8 · md 12 · lg 16 · xl 24. `sm`/DEFAULT are nudged up
        // from Tailwind's 2px/4px so currently-sharp elements move toward the
        // app's rounded look.
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1rem",
      },
      boxShadow: {
        // Mirrors CARD_SHADOW / CARD_SHADOW_LG in the app theme.
        card: "0 6px 14px -4px rgba(15,23,42,0.08), 0 2px 6px -2px rgba(15,23,42,0.05)",
        "card-lg": "0 14px 30px -8px rgba(15,23,42,0.12), 0 4px 10px -4px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
