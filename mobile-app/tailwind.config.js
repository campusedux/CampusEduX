/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Mirrors COLORS in src/constants/theme.ts. Without these, utilities the
      // UI already uses (bg-primary, text-primary, border-danger, ...) resolve
      // to nothing and controls render invisible/unstyled.
      colors: {
        // DEFAULT powers `bg-primary` / `text-primary`; the numeric scale
        // powers `bg-primary-50` and `bg-primary-900`, both already in use.
        primary: {
          DEFAULT: '#4F39F6',
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C7CBFE',
          300: '#A5A9FC',
          400: '#8480F9',
          500: '#4F39F6',
          600: '#4429EA',
          700: '#3A20CE',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: '#F8F9FC',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
};
