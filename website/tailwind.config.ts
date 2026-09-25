import type { Config } from "tailwindcss";

/**
 * CampusEduX website design tokens (redesign/ui-2026).
 *
 * Every colour is a CSS variable holding space-separated RGB channels, defined
 * in `src/app/globals.css` for `:root` (light) and `.dark` (dark). That is what
 * makes dark mode work site-wide without `dark:` variants on every element, and
 * keeps Tailwind's `/opacity` modifiers working (`bg-primary/10`, `border-line/60`).
 *
 * Token roles:
 * - `canvas`  page ground · `card` raised surfaces (was `bg-white`) ·
 *   `surface` inset fills (inputs, tinted rows) · `line` borders
 * - `ink` / `ink-muted` / `ink-faint` text, strongest → weakest
 * - `primary` brand indigo (+ 50–900 scale), `success` / `danger` / `warning`
 * - `scrim` modal/drawer backdrop — near-black in BOTH themes (never use `ink`
 *   for a backdrop: it turns light in dark mode)
 *
 * `text-primary` / `text-success` / `text-danger` resolve to a separate
 * `*-text` variable (see `textColor` below): in dark mode the solid fill has to
 * stay deep enough for white button labels while text on a dark card has to be
 * lighter to stay legible — one value cannot satisfy both.
 */
const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const primaryScale = {
  DEFAULT: rgb("primary"),
  50: rgb("primary-50"),
  100: rgb("primary-100"),
  200: rgb("primary-200"),
  300: rgb("primary-300"),
  400: rgb("primary-400"),
  500: rgb("primary"),
  600: rgb("primary-600"),
  700: rgb("primary-700"),
  800: rgb("primary-800"),
  900: rgb("primary-900"),
};

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: primaryScale,
        canvas: rgb("canvas"),
        card: rgb("card"),
        surface: rgb("surface"),
        line: rgb("line"),
        scrim: rgb("scrim"),
        ink: {
          DEFAULT: rgb("ink"),
          muted: rgb("ink-muted"),
          faint: rgb("ink-faint"),
        },
        success: rgb("success"),
        danger: rgb("danger"),
        warning: rgb("warning"),
        // Fixed pastel accent set for category / module tiles. Use with an
        // opacity suffix for the soft fill, solid for the icon/label. Mid-tone
        // on purpose, so they read on both a white and a dark card.
        accent: {
          violet: "#7C3AED",
          sky: "#3B82F6",
          emerald: "#16A34A",
          amber: "#F59E0B",
          pink: "#EC4899",
          teal: "#0D9488",
        },
      },
      textColor: {
        primary: { DEFAULT: rgb("primary-text") },
        success: rgb("success-text"),
        danger: rgb("danger-text"),
      },
      fontFamily: {
        // Self-hosted by next/font in the root layout (no external font host,
        // so the CSP's `font-src 'self'` still holds).
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Alias so any stray `font-serif` never reintroduces a serif.
        serif: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        // Scale: sm 8 · md 12 · lg 16 · xl 20 · 2xl 16 (cards) · 3xl 24 (hero panels).
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-lg": "var(--shadow-card-lg)",
        glow: "var(--shadow-glow)",
      },
      keyframes: {
        // Subtle, fast entrances. All are neutralised by the reduced-motion
        // guard in globals.css.
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
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "progress-fill": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out both",
        "fade-in-up": "fade-in-up .22s ease-out both",
        "scale-in": "scale-in .16s ease-out both",
        "slide-up": "slide-up .28s cubic-bezier(.2,.8,.2,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "progress-fill": "progress-fill .8s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
