import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#fafaf8',
        ink: {
          DEFAULT: '#0d0e11',
          2: '#23252c',
          3: '#6b7280',
          4: '#9ca3af',
        },
        line: {
          DEFAULT: '#e5e7eb',
          2: '#f3f4f6',
        },
        gold: {
          DEFAULT: '#c49a2a',
          bg: '#fefce8',
          border: '#fde68a',
        },
        green: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
        },
        blue: '#2563eb',
        red: '#dc2626',
        white: '#ffffff',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        'geist-mono': ['Geist Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in': 'slideIn 0.6s ease forwards',
        'pitch-num': 'pitchNum 0.6s ease forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'demo-pulse': 'demoPulse 2s ease infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pitchNum: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        demoPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
export default config
