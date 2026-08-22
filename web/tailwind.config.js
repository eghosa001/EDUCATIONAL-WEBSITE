/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fbf8f1',
          100: '#f5eedf',
          200: '#eadfc5',
          300: '#ddcba3',
          400: '#c9ad70',
          500: '#b8934f',
          600: '#a67c38',
          700: '#8a642e',
          800: '#704f29',
          900: '#5a4125',
          950: '#382719',
        },
        navy: {
          50: '#f4f5f9',
          100: '#e7e9f0',
          200: '#cfd3e0',
          300: '#aeb5c8',
          400: '#858da7',
          500: '#646d89',
          600: '#4b5470',
          700: '#39425d',
          800: '#29314b',
          900: '#1f2640',
          950: '#151a3a',
        },
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgb(21 26 58 / 0.08)',
        'brand': '0 8px 24px rgb(21 26 58 / 0.12)',
        'brand-lg': '0 16px 40px rgb(21 26 58 / 0.16)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
