import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#12213D",
        paper: "#F5F6F2",
        marigold: "#FFB100",
        "marigold-deep": "#E09A00",
        emerald: "#1F7A53",
        slate: "#5C677D",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};
export default config;
