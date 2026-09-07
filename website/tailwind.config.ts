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
 * The legacy editorial tokens (navy / paper / marigold / emerald / slate) were
 * removed at the end of P7 once every page moved to the shared component system.
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
        surface: "#F8F9FC", // interior fills (inputs, tinted rows, empty states)
        // Page ground — a very light indigo/lavender tint so pure-white cards
        // lift off the page. Mood cue from the mobile brief; kept subtle.
        canvas: "#F7F8FD",
        ink: {
          DEFAULT: "#111827", // textPrimary
          muted: "#6B7280", // textSecondary — AA on white (4.8:1)
          faint: "#6E7583", // textMuted — darkened from the app's #9CA3AF to ~4.2:1 for a11y
        },
        line: "#E5E7EB", // border
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#F59E0B",
        // Fixed pastel accent set for category / module tiles, so those stop
        // hard-coding hex + opacity in inline styles. Use with an opacity
        // suffix for the soft fill, solid for the icon/label.
        accent: {
          violet: "#7C3AED",
          sky: "#3B82F6",
          emerald: "#16A34A",
          amber: "#F59E0B",
          pink: "#EC4899",
          teal: "#0D9488",
        },
      },
      fontFamily: {
        // The app uses the platform system font. `serif` is aliased to the same
        // stack so any stray `font-serif` never reintroduces a serif.
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
      keyframes: {
        // Subtle, fast entrances (spec §15). All are neutralised by the
        // reduced-motion guard in globals.css.
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out both",
        "fade-in-up": "fade-in-up .22s ease-out both",
        "scale-in": "scale-in .16s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
