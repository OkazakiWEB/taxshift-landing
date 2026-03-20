import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        background: '#fafaf8',
        ink: '#0d0e11',
        ink2: '#23252c',
        ink3: '#6b7280',
        ink4: '#9ca3af',
        line: '#e5e7eb',
        line2: '#f3f4f6',
        gold: '#c49a2a',
        'gold-bg': '#fefce8',
        green: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        red: {
          DEFAULT: '#dc2626',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        blue: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}

export default config
