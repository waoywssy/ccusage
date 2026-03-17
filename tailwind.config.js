/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        sand: '#f6f1e8',
        ember: '#d9481f',
        moss: '#4d6b57',
        gold: '#c89b3c',
      },
      boxShadow: {
        card: '0 22px 55px rgba(23, 23, 23, 0.14)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
