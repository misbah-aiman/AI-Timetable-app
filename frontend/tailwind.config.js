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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(117,6,8,0.12)',
        'soft-lg': '0 4px 32px 0 rgba(117,6,8,0.18)',
        card: '0 1px 8px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
