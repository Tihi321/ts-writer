/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}", // Include all relevant file types in src
  ],
  darkMode: 'class', // or 'media', if you prefer OS-level dark mode setting
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example of extending theme with a custom font
        typewriter: ['Courier Prime', 'Courier New', 'monospace'],
        vintage: ['Special Elite', 'Courier New', 'monospace'],
        mono: ['JetBrains Mono', 'Courier Prime', 'monospace'],
      },
      // You can extend colors, spacing, etc. here
      colors: {
        primary: '#3B82F6', // Example blue
        secondary: '#10B981', // Example green
        vintage: {
          50: '#fefdf8',
          100: '#fdf9e7',
          200: '#f9f0c4',
          300: '#f4e397',
          400: '#ecd368',
          500: '#e2c044',
          600: '#d4a72c',
          700: '#b08b23',
          800: '#8f6f23',
          900: '#785c22',
        },
        paper: {
          50: '#fefefe',
          100: '#fdfdfc',
          200: '#f8f8f6',
          300: '#f3f3f0',
          400: '#eeeee8',
          500: '#e8e8e0',
          600: '#d4d4c8',
          700: '#b8b8a8',
          800: '#9c9c88',
          900: '#808068',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 