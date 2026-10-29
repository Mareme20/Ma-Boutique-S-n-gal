/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#FDF7F4',
          100: '#F9EDE5',
          200: '#F4DACB',
          300: '#EABEA7',
          400: '#DD9575',
          500: '#C2542D', // Primary deep luxury terracotta
          600: '#A94320',
          700: '#8A3519',
          800: '#702B16',
          900: '#4D1D0F',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F5EFEB',
          200: '#EAE1D5',
          300: '#DCCEC0',
          400: '#C7B29F',
          500: '#AF957F',
          600: '#927863',
          700: '#745E4D',
        },
        onyx: {
          DEFAULT: '#1A1615', // Rich dark warm charcoal
          soft: '#2D2725',
          muted: '#635B56',
          light: '#968E88',
        },
        wa: {
          DEFAULT: '#25D366',
          dark: '#1EBE5D',
          deep: '#128C7E',
        },
        wave: '#1DA1F2',
        om: '#FF7900',
        paper: '#FAF8F5',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-plus-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 20px 45px -15px rgba(26, 22, 21, 0.08), 0 0 0 1px rgba(26, 22, 21, 0.04)',
        'luxury-sm': '0 4px 20px -2px rgba(26, 22, 21, 0.06)',
        'fab': '0 10px 25px -3px rgba(37, 211, 102, 0.35), 0 4px 10px -2px rgba(194, 84, 45, 0.25)',
      },
    },
  },
  plugins: [],
};

