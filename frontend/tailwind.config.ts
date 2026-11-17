import type { Config } from 'tailwindcss';

/**
 * Section 5 design tokens.
 *
 * Every semantic colour is backed by a CSS custom property (see
 * `src/styles/globals.css`). Components keep consuming `bg-surface`,
 * `text-primary`, `border-border`, etc., and the whole palette flips when the
 * `dark` class is present on <html>. Literal chart / backdrop colours use
 * Tailwind's `dark:` variant where they cannot be expressed as a token.
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../i18n/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          hover: token('strong-hover'),
        },
        /** Solid dark/blue surfaces (buttons, active pills, summary hero). */
        strong: {
          DEFAULT: token('strong'),
          hover: token('strong-hover'),
        },
        accent: {
          DEFAULT: token('accent'),
          /** Background-safe accent for filled buttons. */
          solid: token('accent-solid'),
        },
        success: {
          DEFAULT: token('success'),
          surface: token('success-surface'),
        },
        warning: {
          DEFAULT: token('warning'),
          surface: token('warning-surface'),
        },
        danger: {
          DEFAULT: token('danger'),
          surface: token('danger-surface'),
        },
        surface: token('surface'),
        background: token('background'),
        border: token('border'),
        disabled: token('disabled'),
      },
      fontFamily: {
        sans: ['var(--font-app)'],
        numeric: ['var(--font-numeric)'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h3: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        small: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'small-medium': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        legal: ['11px', { lineHeight: '14px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        focus:
          '0 0 0 2px rgb(var(--color-ring-offset)), 0 0 0 4px rgb(var(--color-accent))',
        rail: 'var(--shadow-rail)',
      },
      keyframes: {
        'spin-fast': {
          to: { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'spin-fast': 'spin-fast 800ms linear infinite',
        'fade-up': 'fade-up 160ms ease-out',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
