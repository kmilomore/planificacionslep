/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#25306B',
        blue:    '#006BB9',
        red:     '#FF1D3D',
        'gray-light': '#EDF0F5',
        'blue-navy': '#2C3D9E',
        verde:    '#22C55E',
        amarillo: '#F59E0B',
        rojo:     '#FF1D3D',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(37, 48, 107, 0.10)',
      },
    },
  },
  plugins: [],
};
