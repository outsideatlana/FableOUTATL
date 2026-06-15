import type { Config } from 'tailwindcss';

/**
 * OutsideAtl brand system — dark nightlife aesthetic, ported from the
 * Lovable design. Anton display, JetBrains Mono labels, Inter body,
 * deep-blue `accent` + red highlights, zero border-radius.
 *
 * Lovable semantic tokens (background/foreground/accent/secondary/card/
 * border/muted-foreground/destructive) drive the public site. The legacy
 * ink/hot/electric/line tokens remain for the admin dashboard.
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
        // ---- Lovable semantic tokens (public site) ----
        background: 'hsl(0 0% 4%)',
        foreground: 'hsl(0 0% 98%)',
        accent: {
          DEFAULT: 'hsl(220 70% 28%)',
          foreground: 'hsl(0 0% 98%)',
        },
        secondary: 'hsl(0 0% 10%)',
        card: 'hsl(0 0% 7%)',
        border: 'hsl(0 0% 98% / 0.15)',
        destructive: 'hsl(0 84% 60%)',
        muted: {
          DEFAULT: '#8a8a8a',
          foreground: 'hsl(0 0% 98% / 0.6)',
        },
        // ---- Legacy tokens (admin dashboard) ----
        ink: { DEFAULT: '#0a0a0a', 800: '#111111', 700: '#161616', 600: '#1c1c1c' },
        hot: { DEFAULT: '#dc2626', 400: '#f87171', 600: '#dc2626', 700: '#b91c1c' },
        electric: { DEFAULT: '#2563eb', 400: '#60a5fa', 600: '#2563eb', 700: '#1d4ed8' },
        line: 'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { none: '0' },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.06)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slide-up 0.8s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 30s linear infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
