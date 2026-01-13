/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        /* NEW: CSS Variable-based tokens (2025 Ambiance System) */
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-foreground': 'var(--primary-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        /* Legacy mapping for backwards compatibility */
        premium: {
          turquoise: 'var(--premium-turquoise)',
          ocean: 'var(--premium-ocean)',
          black: 'var(--premium-black)',
          white: '#FFFFFF',
        },
        medical: {
          grey1: 'var(--surface-muted)',
          grey2: 'var(--border)',
          grey3: '#DCE0E5',
        },
        semantic: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--danger)',
          info: 'var(--info)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      maxWidth: {
        'content': '1480px',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'card': 'var(--shadow-card)',
        'premium': 'var(--shadow-premium)',
        'premium-hover': 'var(--shadow-premium-hover)',
        'premium-panel': '0 0 40px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': 'var(--radius-xl)',
        '2xl': 'calc(var(--radius-xl) + 4px)',
        '3xl': 'calc(var(--radius-xl) + 8px)',
      },
      backdropBlur: {
        'premium': '12px',
      },
      transitionDuration: {
        '180': '180ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        checkmark: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 180ms ease-in-out',
        slideIn: 'slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        checkmark: 'checkmark 300ms ease-in-out',
      },
    },
  },
  plugins: [],
};
