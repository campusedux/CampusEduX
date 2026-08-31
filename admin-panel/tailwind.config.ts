import type { Config } from 'tailwindcss';

/**
 * Admin-panel design system. The consumer mobile app uses #5B5BF6 as its brand
 * colour; the admin panel spec pins the accent to #4F39F6 (the "Hub" in the
 * CampusEduX wordmark, active sidebar pills, primary buttons) and a dark-navy
 * #0F1428 sidebar, so those values win here.
 */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F39F6',
          dark: '#3D2BD4',
          light: '#ECEAFE',
        },
        sidebar: {
          DEFAULT: '#0F1428',
          hover: '#1B2138',
          active: '#4F39F6',
          muted: '#8A90A6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F6F7F9',
          sunken: '#0F1428',
        },
        ink: {
          DEFAULT: '#161923',
          muted: '#5B5E73',
          faint: '#9497AC',
        },
        // Status-pill palette (see spec): green = Active/Success/Published,
        // red = Inactive/Failed/Rejected, amber = Pending, blue = Scheduled.
        success: '#16A34A',
        warning: '#E8A93A',
        danger: '#DC2626',
        info: '#2563EB',
        border: '#E7E8EF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        'load-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'load-bar': 'load-bar 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
