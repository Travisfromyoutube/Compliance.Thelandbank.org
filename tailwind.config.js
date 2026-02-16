/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        heading: ['"Bitter"', 'Georgia', 'serif'],
        label:   ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        /* ── Near-neutral warm base ───────────────────────── */
        bg:         '#f6f5f3',          // neutral warm off-white (less beige)
        surface:    '#ffffff',          // pure white cards
        'surface-alt': '#fafaf9',      // near-white warm tint (lighter, not a well)
        muted:      '#8c8c8c',          // neutral gray helper text
        border:     '#e2e0dc',          // quiet neutral border
        'border-input': '#d4d2cd',     // slightly stronger border for inputs
        text: {
          DEFAULT:    '#1a1a1a',        // near-black body text
          secondary:  '#5c5c5c',        // neutral gray secondary
        },

        /* ── Warm surface tokens (buyer portal) ─────────── */
        'warm-100': '#f0ece5',          // warm stone — hero header, photo slots
        'warm-200': '#e4ddd2',          // deeper warm — spine line, dividers

        /* ── Brand accents (GCLBA-inspired blue/green) ───── */
        accent: {
          DEFAULT: '#2d7a4a',           // civic green
          light:   '#e6f2eb',           // green wash
          dark:    '#1f5c36',           // deep green hover
        },
        'accent-blue': {
          DEFAULT: '#2b5f8a',           // civic blue
          light:   '#e4edf4',           // blue wash
          dark:    '#1e4568',           // deep blue hover
        },

        /* ── Semantic status ──────────────────────────────── */
        success: {
          DEFAULT: '#2d7a4a',
          light:   '#e6f2eb',
        },
        warning: {
          DEFAULT: '#b07d2e',           // warm ochre
          light:   '#faf3e6',
        },
        danger: {
          DEFAULT: '#b83232',           // clear red
          light:   '#fbe8e8',
        },
        info: {
          DEFAULT: '#2b5f8a',
          light:   '#e4edf4',
        },
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        /* Level 1 — card containers */
        sm:    '0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.02)',
        /* Level 2 — interactive focus / hovered surfaces */
        md:    '0 2px 8px -2px rgba(0,0,0,0.08), 0 1px 4px -1px rgba(0,0,0,0.04)',
        /* Removed inner — inputs should not have inset shadow */
        inner: 'none',
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
        checkDraw: {
          from: { strokeDashoffset: '24' },
          to:   { strokeDashoffset: '0' },
        },
        errorShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-4px)' },
          '40%':      { transform: 'translateX(4px)' },
          '60%':      { transform: 'translateX(-3px)' },
          '80%':      { transform: 'translateX(2px)' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.5s ease-out both',
        'gentle-pulse':  'gentlePulse 1.5s ease-in-out infinite',
        'check-draw':    'checkDraw 0.6s ease-out both',
        'error-shake':   'errorShake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
