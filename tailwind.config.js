/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        gold: 'var(--gold)',
        'gold-premium': 'var(--gold-premium)',
        pink: 'var(--pink)',
        'hot-pink': 'var(--hot-pink)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
        '4xl': '32px',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        script: ['Dancing Script', 'cursive'],
      },
      animation: {
        'float': 'floatHeart 4s ease-in-out infinite',
        'float-delay': 'floatHeart 5s ease-in-out 1s infinite',
        'float-slow': 'floatHeart 6s ease-in-out 2s infinite',
        'pulse-green': 'pulse-green 2s infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-hero': 'radial-gradient(ellipse at 50% 0%, #7C3AED 0%, #5B21B6 40%, #3B0764 70%, #170a2e 100%)',
        'gradient-purple': 'linear-gradient(135deg, #5B21B6 0%, #6D28D9 50%, #7C3AED 100%)',
        'gradient-pink-purple': 'linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FBBF24 0%, #D4AF37 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
        'glow-pink': '0 0 30px rgba(236,72,153,0.6), 0 0 60px rgba(236,72,153,0.2)',
        'glow-gold': '0 0 30px rgba(251,191,36,0.5), 0 0 60px rgba(251,191,36,0.15)',
        'phone': '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.3)',
        'card': '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.15)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};