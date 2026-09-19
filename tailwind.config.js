/** @type {import('tailwindcss').Config} */

/**
 * Colours resolve through CSS custom properties declared in src/styles.css, which
 * are redefined under `html.dark`. That means a token like `bg-surface-elevated`
 * is automatically theme-aware — no `dark:` variant needed at the call site — and
 * the same values are readable from TypeScript at runtime.
 *
 * The channels are stored space-separated (`57 224 121`) rather than as hex so the
 * `<alpha-value>` placeholder keeps working: `bg-primary/20` still compiles.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: token('primary'),
        'on-primary': token('on-primary'),
        secondary: token('secondary'),
        'secondary-container': token('secondary-container'),
        tertiary: token('tertiary'),
        'tertiary-container': token('tertiary-container'),
        'on-tertiary-container': token('on-tertiary-container'),
        surface: token('surface'),
        'surface-variant': token('surface-variant'),
        'surface-elevated': token('surface-elevated'),
        outline: token('outline'),
      },
      fontFamily: {
        display: ['Spline Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Spline Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'elevation-1':
          '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-2':
          '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'elevation-3':
          '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
      },
      spacing: {
        /* Clearance for the fixed bottom nav. Declared once in styles.css. */
        'nav-clearance': 'var(--nav-clearance)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'spin-slow': 'spin 12s linear infinite',
        'fade-in-up': 'fade-in-up 500ms ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
