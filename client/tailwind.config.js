/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blackbox: {
          dark: '#0a0a0a',
          gray: '#1a1a1a',
          light: '#2a2a2a',
        }
      }
    },
  },
  plugins: [],
};
