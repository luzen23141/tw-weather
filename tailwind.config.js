/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material You Target Tokens
        'md-primary': 'var(--color-md-primary)',
        'md-on-primary': 'var(--color-md-on-primary)',
        'md-primary-container': 'var(--color-md-primary-container)',
        'md-on-primary-container': 'var(--color-md-on-primary-container)',
        'md-secondary': 'var(--color-md-secondary)',
        'md-secondary-container': 'var(--color-md-secondary-container)',
        'md-on-secondary-container': 'var(--color-md-on-secondary-container)',
        'md-tertiary': 'var(--color-md-tertiary)',
        'md-on-tertiary': 'var(--color-md-on-tertiary)',
        'md-tertiary-container': 'var(--color-md-tertiary-container)',
        'md-on-tertiary-container': 'var(--color-md-on-tertiary-container)',
        'md-background': 'var(--color-md-background)',
        'md-on-background': 'var(--color-md-on-background)',
        'md-surface': 'var(--color-md-surface)',
        'md-on-surface': 'var(--color-md-on-surface)',
        'md-surface-variant': 'var(--color-md-surface-variant)',
        'md-on-surface-variant': 'var(--color-md-on-surface-variant)',
        'md-surface-container-low': 'var(--color-md-surface-container-low)',
        'md-surface-container': 'var(--color-md-surface-container)',
        'md-outline': 'var(--color-md-outline)',
        'md-error': 'var(--color-md-error)',
        'md-on-error': 'var(--color-md-on-error)',
        'md-error-container': 'var(--color-md-error-container)',
        'md-on-error-container': 'var(--color-md-on-error-container)',
        // Glass Token
        'glass-border': 'var(--color-glass-border)',
        'glass-border-strong': 'var(--color-glass-border-strong)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '48px',
      },
      backdropBlur: {
        glass: '20px',
        'glass-strong': '30px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.06)',
        'glass-dark': '0 4px 30px rgba(0, 0, 0, 0.20)',
        'glass-glow': '0 0 40px rgba(8, 145, 178, 0.15)',
      },
      transitionTimingFunction: {
        'em-decelerate': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
