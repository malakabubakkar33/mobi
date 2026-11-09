/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'mobi-green': {
          DEFAULT: '#168447',
          dark: '#126d3a',
          light: '#E8F6EC',
          border: '#d0ebd8',
          subtle: '#f4fbf6',
        },
        'mobi-charcoal': {
          DEFAULT: '#20252D',
          muted: '#4A525D',
          light: '#737B85',
        },
        'mobi-border': {
          DEFAULT: '#E8EBE9',
          light: '#F2F4F3',
          dark: '#D7DCD9',
        },
        'mobi-gray': {
          50: '#F9FAFA',
          100: '#F4F5F5',
          200: '#E8EBE9',
          300: '#D5DAD7',
          400: '#9DA6A0',
          500: '#737B85',
          600: '#4A525D',
          700: '#20252D',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'soft': '0 4px 20px -2px rgba(22, 132, 71, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px -4px rgba(0, 0, 0, 0.07), 0 4px 8px -2px rgba(0, 0, 0, 0.03)',
        'url-bar': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'url-focus': '0 0 0 3px rgba(22, 132, 71, 0.15), 0 4px 16px rgba(22, 132, 71, 0.06)',
      },
    },
  },
  plugins: [],
}
