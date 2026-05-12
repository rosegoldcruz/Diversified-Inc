import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Design Tokens
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surfaceSoft: "rgb(var(--color-surface-soft) / <alpha-value>)",
        surfaceHover: "rgb(var(--color-surface-hover) / <alpha-value>)",

        // Professional Blues (replaces neon accents)
        cyber: {
          cyan: "rgb(var(--color-cyber-cyan) / <alpha-value>)",
          cyanDim: "rgb(var(--color-cyber-cyan-dim) / <alpha-value>)",
          cyanGlow: "rgb(var(--color-cyber-cyan) / 0.2)",
          magenta: "rgb(var(--color-cyber-magenta) / <alpha-value>)",
          magentaDim: "rgb(var(--color-cyber-magenta-dim) / <alpha-value>)",
          magentaGlow: "rgb(var(--color-cyber-magenta) / 0.2)",
          yellow: "rgb(var(--color-cyber-yellow) / <alpha-value>)",
          yellowDim: "rgb(var(--color-cyber-yellow-dim) / <alpha-value>)",
          yellowGlow: "rgb(var(--color-cyber-yellow) / 0.2)",
          red: "rgb(var(--color-cyber-red) / <alpha-value>)",
          green: "rgb(var(--color-cyber-green) / <alpha-value>)",
        },

        // Backgrounds — light mode
        bgDarkest: "rgb(var(--color-bg-darkest) / <alpha-value>)",
        bgDark: "rgb(var(--color-bg-dark) / <alpha-value>)",
        bgMedium: "rgb(var(--color-bg-medium) / <alpha-value>)",
        bgLight: "rgb(var(--color-bg-light) / <alpha-value>)",
        bgLighter: "rgb(var(--color-bg-lighter) / <alpha-value>)",

        // Borders
        borderSubtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
        borderHover: "rgb(var(--color-border-hover) / <alpha-value>)",
        borderFocus: "rgb(var(--color-border-focus) / <alpha-value>)",

        // Text
        textPrimary: "rgb(var(--color-text-primary) / <alpha-value>)",
        textSecondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        textMuted: "rgb(var(--color-text-muted) / <alpha-value>)",
        textDisabled: "rgb(var(--color-text-disabled) / <alpha-value>)",

        // Corporate primary palette
        navy: "rgb(var(--color-navy) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        accentBlue: "rgb(var(--color-accent) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.04)",
        glass:
          "0 24px 80px rgba(15, 23, 42, 0.12), 0 8px 28px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
        glassHover:
          "0 34px 110px rgba(15, 23, 42, 0.16), 0 12px 36px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.86)",
        cyberSm:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.04)",
        cyberMd:
          "0 1px 3px rgba(15, 23, 42, 0.05), 0 18px 38px rgba(15, 23, 42, 0.07)",
        cyberLg:
          "0 2px 6px rgba(15, 23, 42, 0.06), 0 28px 60px rgba(15, 23, 42, 0.10)",
        cyberMagenta:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.04)",
        cyberYellow:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 28px rgba(15, 23, 42, 0.04)",
        cyberInset:
          "inset 0 1px 0 rgba(255, 255, 255, 0.70), inset 0 -1px 0 rgba(15, 23, 42, 0.04)",
      },
      borderRadius: {
        md: "0.625rem",
        lg: "0.75rem",
        xl: "0.9375rem",
        "2xl": "1rem",
        "3xl": "1rem",
        cyber: "0.9375rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        // mono and display also use Inter — no monospace or display fonts in this theme
        mono: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse 2s infinite",
        shimmer: "shimmer 2s infinite",
        "shine-sweep": "shine-sweep 3.2s ease-in-out infinite",
        "fade-blur-in": "fade-blur-in 800ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "shine-sweep": {
          "0%, 52%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "fade-blur-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(14px)",
            filter: "blur(14px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            filter: "blur(0)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
