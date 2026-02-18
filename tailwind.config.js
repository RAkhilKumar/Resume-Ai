/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans','sans-serif'],
        display: ['Syne','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
      colors: {
        brand: { 50:'#f0f4ff',100:'#e0eaff',200:'#c7d9ff',300:'#a4bfff',400:'#7a9aff',500:'#4f72ff',600:'#3452f5',700:'#2a3fe0',800:'#2535b5',900:'#23308e',950:'#161e57' },
        surface: { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',800:'#1e293b',900:'#0f172a',950:'#020617' }
      },
      animation: { 'fade-in':'fadeIn 0.5s ease forwards','slide-up':'slideUp 0.4s ease forwards','pulse-slow':'pulse 3s infinite' },
      keyframes: {
        fadeIn:{ from:{opacity:'0'},to:{opacity:'1'} },
        slideUp:{ from:{opacity:'0',transform:'translateY(16px)'},to:{opacity:'1',transform:'translateY(0)'} }
      }
    }
  },
  plugins: []
}
