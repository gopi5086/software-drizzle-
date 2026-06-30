export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#002155",
        "elegant-gold": "#D4AF37",
        "deep-charcoal": "#1A1D21",
        "soft-slate": "#64748B",
        "background": "#f8f9ff",
        "surface-glass": "rgba(255, 255, 255, 0.7)",
        "border-subtle": "rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
