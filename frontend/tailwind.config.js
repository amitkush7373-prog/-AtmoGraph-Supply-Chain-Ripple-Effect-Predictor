/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1220',
        panel: '#121B2E',
        panelHover: '#16223A',
        border: '#1F2A3F',
        textPrimary: '#E6EDF7',
        textSecondary: '#7C8AA5',
        textMuted: '#4E5C74',
        signal: '#3FC7C0',
        risk: {
          low: '#3FC7A0',
          moderate: '#E8B84B',
          elevated: '#E8823D',
          high: '#E2493D',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(63, 199, 192, 0.25)',
        riskGlow: '0 0 16px rgba(226, 73, 61, 0.35)',
      },
    },
  },
  plugins: [],
}