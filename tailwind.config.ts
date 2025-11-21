import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Paleta com foco em contraste (WCAG AA/AAA orientativo)
        primary: {
          DEFAULT: '#0052CC', // azul forte para boa legibilidade com texto branco
          foreground: '#FFFFFF'
        },
        success: {
          DEFAULT: '#137B39',
          foreground: '#FFFFFF'
        },
        warning: {
          DEFAULT: '#8A7000',
          foreground: '#FFFFFF'
        },
        danger: {
          DEFAULT: '#A61222',
          foreground: '#FFFFFF'
        },
        neutral: {
          50: '#FFFFFF',
          100: '#F8FAFC',
          200: '#EEF2F7',
          300: '#D9E1EA',
          400: '#A7B4C2',
          500: '#5A6B7A',
          600: '#3D4A57',
          700: '#2A343C',
          800: '#1A2127',
          900: '#0E1419'
        }
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(0, 82, 204, 0.4)'
      }
    }
  }
} satisfies Config