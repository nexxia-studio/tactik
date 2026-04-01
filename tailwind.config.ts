import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", "[data-theme=\"dark\"]"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Chaney", "Arial Black", "sans-serif"],
        ui: ["N27", "DM Sans", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          dim: "var(--color-primary-dim)",
          glow: "var(--color-primary-glow)",
          border: "var(--color-primary-border)",
          text: "var(--color-primary-text)",
        },
        "bg-base": "var(--bg-base)",
        "bg-surface-1": "var(--bg-surface-1)",
        "bg-surface-2": "var(--bg-surface-2)",
        "bg-surface-3": "var(--bg-surface-3)",
        "t-primary": "var(--text-primary)",
        "t-secondary": "var(--text-secondary)",
        "t-muted": "var(--text-muted)",
        "t-disabled": "var(--text-disabled)",
        "b-subtle": "var(--border-subtle)",
        "b-default": "var(--border-default)",
        "b-strong": "var(--border-strong)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
        "chem-optimal": "var(--chem-optimal)",
        "chem-good": "var(--chem-good)",
        "chem-weak": "var(--chem-weak)",
        "chem-bad": "var(--chem-bad)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
