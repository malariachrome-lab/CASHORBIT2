/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0E17',
        surface: '#1E1E1E',
        'surface-light': '#2A2A2A',
        primary: '#007BFF',
        'primary-hover': '#0056b3',
        success: '#10B981',
        'success-dark': '#059669',
        error: '#EF4444',
        warning: '#F59E0B',
        'neon-pink': '#FF2D95',
        'neon-cyan': '#00F0FF',
        'neon-purple': '#B829F7',
        'neon-orange': '#FF9D00',
        'neon-green': '#39FF14',
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#6B6B6B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'glass-hover': 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'gradient-rainbow': 'linear-gradient(90deg, #FF2D95, #B829F7, #007BFF, #00F0FF, #39FF14, #FF9D00)',
        'gradient-aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glow': '0 0 20px rgba(0, 123, 255, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-pink': '0 0 30px rgba(255, 45, 149, 0.4)',
        'glow-cyan': '0 0 30px rgba(0, 240, 255, 0.4)',
        'glow-purple': '0 0 30px rgba(184, 41, 247, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 123, 255, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(0, 123, 255, 0.6)' },
        },
        gradientX: {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'right center' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
