/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FFF0F0',
          100: '#FFD6D7',
          200: '#FFA8A9',
          300: '#FF6B6D',
          400: '#E83335',
          500: '#C01619',
          600: '#960B0D',
          700: '#750608',
          800: '#5A0405',
          900: '#3D0203',
        },
        surface: {
          50:  '#ffffff',
          100: '#FFF5E0',
          200: '#FFE8BC',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
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
        soft:     '0 2px 16px 0 rgba(117,6,8,0.10)',
        'soft-lg':'0 8px 40px 0 rgba(117,6,8,0.15)',
        card:     '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-lg':'0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.10)',
        sheet:    '0 -4px 40px rgba(0,0,0,0.14)',
        nav:      '0 -0.5px 0 rgba(0,0,0,0.10)',
        glass:    'inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 4px rgba(0,0,0,0.05)',
        inner:    'inset 0 1px 3px rgba(0,0,0,0.06)',
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
