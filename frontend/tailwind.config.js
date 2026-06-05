/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E6F5F5',
          100: '#B3E0E0',
          200: '#80CCCC',
          300: '#4DB8B8',
          400: '#26A6A6',
          500: '#008080',
          600: '#006666',
          700: '#004D4D',
          800: '#003333',
          900: '#001A1A',
        },
        surface: {
          50:  '#FAFFFE',
          100: '#F0F9F8',
          200: '#E1F3F2',
        },
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'SF Pro Text', 'system-ui', 'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
      },
      boxShadow: {
        soft:           '0 2px 16px 0 rgba(0,77,77,0.10)',
        'soft-lg':      '0 8px 40px 0 rgba(0,77,77,0.15)',
        card:           '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-lg':      '0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.10)',
        sheet:          '0 -4px 40px rgba(0,0,0,0.14)',
        nav:            '0 -0.5px 0 rgba(0,0,0,0.10)',
        glass:          'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 4px rgba(0,0,0,0.05)',
        inner:          'inset 0 1px 3px rgba(0,0,0,0.06)',
        'glow-primary': '0 4px 22px rgba(0,128,128,0.30)',
        'glow-primary-sm': '0 2px 12px rgba(0,128,128,0.22)',
        'glow-red':     '0 4px 20px rgba(239,68,68,0.32)',
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.92) translateY(8px)', opacity: '0' },
          to:   { transform: 'scale(1)    translateY(0)',   opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(14px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in':  'fade-in  0.2s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.34, 1.30, 0.64, 1) both',
        'slide-up': 'slide-up 0.22s ease-out both',
        'pop':      'pop 0.15s ease-in-out',
      },
    },
  },
  plugins: [],
};
