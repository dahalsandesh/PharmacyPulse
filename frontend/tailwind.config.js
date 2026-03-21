/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medstore: {
          bg: '#F7F6F3',
          sidebar: '#1A1D23',
          teal: '#0D9488',
          'teal-hover': '#0F766E',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
          overstock: '#8B5CF6',
          card: '#FFFFFF',
          border: '#E5E3DE',
          'text-main': '#1A1D23',
          'text-muted': '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
