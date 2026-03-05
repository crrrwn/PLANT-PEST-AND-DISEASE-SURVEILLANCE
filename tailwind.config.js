/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Extracted from COLOR_PALETTE.png
        brand: {
          950: '#072F36',
          900: '#0A4550',
          800: '#0D5C6A', // darkest teal — headers
          700: '#0E6E7E',
          600: '#108090',
          500: '#129EAC', // medium teal — buttons
          400: '#14B8C4',
          300: '#00CDD2', // bright cyan — accent
          200: '#5DDDDF',
          100: '#AAECED',
          50:  '#E8F9FA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
