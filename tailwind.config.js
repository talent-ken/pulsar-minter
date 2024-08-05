/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: '#56fa01',
        secondary: '#3180ff',
        gray: {
          50: '#FBFBFB',
          100: '#F5F5F5',
          150: '#EEEEEE',
          200: '#E5E5E5',
          300: '#D3D3D3',
          400: '#A0A0A0',
          500: '#707070',
          600: '#505050',
          700: '#3E3E3E',
          800: '#242424',
          900: '#181818'
        }
      },
      spacing: {
        0.25: '0.0625rem', // 1px
        100: '25rem', // 400px
        130: '32.5rem', // 520px
        160: '40rem' // 640px
      },
      fontFamily: {
        sans: ['sora', 'sans-serif']
      },
      backgroundImage: {
        staybull: "url('/src/assets/images/bg_pulsar.webp')"
      },
      maxWidth: {
        max: '94.5rem' // 1512px MAX WIDTH
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.5rem' }]
      }
    }
  },
  plugins: [require('tailwind-scrollbar')({ nocompatible: true })]
};
