/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Custom color palette for DEX
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-primary': 'glowPrimary 2.5s ease-in-out infinite alternate',
        'glow-accent': 'glowAccent 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.8)' },
        },
        glowPrimary: {
          '0%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' },
          '100%': { boxShadow: '0 0 60px rgba(34, 197, 94, 0.6)' },
        },
        glowAccent: {
          '0%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.7)' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#3b82f6',
          'secondary': '#6b7280',
          'accent': '#10b981',
          'neutral': '#374151',
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#e5e7eb',
          'base-content': '#1f2937',
          'info': '#0ea5e9',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444',
        },
      },
      {
        dark: {
          'primary': '#60a5fa',
          'secondary': '#9ca3af',
          'accent': '#34d399',
          'neutral': '#d1d5db',
          'base-100': '#0a0a0a',
          'base-200': '#111111',
          'base-300': '#1a1a1a',
          'base-content': '#e5e7eb',
          'info': '#38bdf8',
          'success': '#22c55e',
          'warning': '#fbbf24',
          'error': '#f87171',
        },
      },
      {
        matrix: {
          'primary': '#16a34a',
          'secondary': '#22c55e',
          'accent': '#10b981',
          'neutral': '#9ca3af',
          'base-100': '#000000',
          'base-200': '#0a0a0a',
          'base-300': '#111111',
          'base-content': '#d1fae5',
          'info': '#34d399',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444',
        },
      },
    ],
    darkTheme: 'matrix',
  },
}
