/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        "bg-base": "#0F0F0F",
        "bg-surface": "#1A1A1A",
        "bg-card": "#242424",
        "bg-elevated": "#2C2C2C",
        border: "#2E2E2E",
        accent: "#00E5C0",
        p1: "#EF4444",
        p2: "#F97316",
        p3: "#3B82F6",
        p4: "#6B7280",
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.4)",
        elevated: "0 8px 32px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "50%": { boxShadow: "0 0 12px 3px rgba(239,68,68,0.4)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
