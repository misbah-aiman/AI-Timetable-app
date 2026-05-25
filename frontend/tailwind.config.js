/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf9f4',
          100: '#f7eedf',
          200: '#edddc0',
          300: '#dfc49a',
          400: '#cfab7c',
          500: '#C4A882',
          600: '#a8895f',
          700: '#876c48',
          800: '#655135',
          900: '#433522',
        },
        surface: {
          50:  '#ffffff',
          100: '#faf9f7',
          200: '#f3efe8',
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
        soft: '0 2px 16px 0 rgba(167,109,96,0.10)',
        'soft-lg': '0 4px 32px 0 rgba(167,109,96,0.15)',
        card: '0 1px 8px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
