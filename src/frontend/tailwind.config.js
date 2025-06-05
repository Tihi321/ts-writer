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
      },
      // You can extend colors, spacing, etc. here
      colors: {
        primary: '#3B82F6', // Example blue
        secondary: '#10B981', // Example green
      }
    },
  },
  plugins: [],
}; 