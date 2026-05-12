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
        soft: "0 1px 3px rgba(15, 23, 42, 0.05)",
        cyberSm: "0 1px 3px rgba(15, 23, 42, 0.05)",
        cyberMd: "0 4px 10px rgba(15, 23, 42, 0.07)",
        cyberLg: "0 12px 24px rgba(15, 23, 42, 0.10)",
        cyberMagenta: "0 1px 3px rgba(15, 23, 42, 0.05)",
        cyberYellow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        cyberInset: "inset 0 1px 2px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.625rem",
        "3xl": "0.625rem",
        cyber: "0.5rem",
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
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
