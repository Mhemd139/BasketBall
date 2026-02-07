import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Navy Blue - Primary (from logo background)
        navy: {
          50: '#e6eaf0',
          100: '#c0cad9',
          200: '#96a7c0',
          300: '#6c84a7',
          400: '#4d6994',
          500: '#2e4f81',
          600: '#254263',  // Logo navy
          700: '#1a2f4f',  // Logo background
          800: '#0f1f3d',  // Darkest navy
          900: '#0a1628',  // Ultra dark
          950: '#050b14',  // Near black
        },
        
        // Gold/Yellow - Primary Accent (from logo banner)
        gold: {
          50: '#fffbeb',
          100: '#fff4c6',
          200: '#ffe866',  // Light gold
          300: '#ffdf33',  // Bright gold
          400: '#ffd700',  // Logo banner gold
          500: '#f4c430',  // Rich gold
          600: '#e6c200',  // Dark gold
          700: '#d4af37',  // Antique gold
          800: '#b8960a',  // Deep gold
          900: '#8b7000',  // Darkest gold
        },
        
        // Basketball Orange - Secondary Accent
        orange: {
          50: '#fff3ed',
          100: '#ffe4d5',
          200: '#ffc9aa',
          300: '#ffa574',
          400: '#e68a52',  // Light orange
          500: '#d97639',  // Logo basketball
          600: '#c86432',  // Rich orange
          700: '#b34e1e',  // Dark orange
          800: '#923e19',  // Deep orange
          900: '#7a3318',  // Darkest orange
        },
        
        // Semantic Colors
        success: {
          DEFAULT: '#10b981',  // Present
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',  // Late
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',  // Absent
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
      },
      
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        hebrew: ['Rubik', 'Noto Sans Hebrew', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      boxShadow: {
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-gold-lg': '0 0 30px rgba(255, 215, 0, 0.5)',
        'glow-orange': '0 0 20px rgba(217, 118, 57, 0.3)',
      },
      
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
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
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
