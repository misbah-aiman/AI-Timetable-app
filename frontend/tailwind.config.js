/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf6f4',
          100: '#f7e8e3',
          200: '#eed9d1',
          300: '#ddb8ac',
          400: '#c49487',
          500: '#A76D60',
          600: '#8f5a4e',
          700: '#74463b',
          800: '#5a362c',
          900: '#3f251e',
        },
        surface: {
          50: '#faf8f5',
          100: '#f3ede5',
          200: '#e8ddd2',
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
        soft: '0 2px 16px 0 rgba(124,58,237,0.08)',
        'soft-lg': '0 4px 32px 0 rgba(124,58,237,0.12)',
        card: '0 1px 8px 0 rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
