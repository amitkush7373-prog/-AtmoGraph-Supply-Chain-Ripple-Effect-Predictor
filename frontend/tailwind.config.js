/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070B13',
          800: '#0B0F19',
          700: '#111827',
          600: '#1F2937',
          500: '#374151',
          400: '#4B5563',
          300: '#9CA3AF',
        },
        brand: {
          500: '#3B82F6',
          600: '#2563EB',
          400: '#60A5FA',
          accent: '#06B6D4',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}