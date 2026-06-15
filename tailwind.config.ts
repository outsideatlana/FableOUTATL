import type { Config } from 'tailwindcss';

/**
 * OutsideAtl brand system — dark nightlife aesthetic.
 * Anton display type, JetBrains Mono labels, Inter body,
 * red "hot" + blue "electric" accents, zero border-radius.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          800: '#111111',
          700: '#161616',
          600: '#1c1c1c',
        },
        hot: {
          DEFAULT: '#dc2626',
          400: '#f87171',
          600: '#dc2626',
          700: '#b91c1c',
        },
        electric: {
          DEFAULT: '#2563eb',
          400: '#60a5fa',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        line: 'rgba(255,255,255,0.10)',
        muted: '#8a8a8a',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
