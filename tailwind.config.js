/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        secondary: '#4CAF50',
        light: '#E8F5E9',
        success: '#388E3C',
        warning: '#FFA000',
        error: '#D32F2F',
        pending: '#FFA000',
        approved: '#388E3C',
        declined: '#D32F2F',
        expired: '#9E9E9E',
        completed: '#1976D2',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}