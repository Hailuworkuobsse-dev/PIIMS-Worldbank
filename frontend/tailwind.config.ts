import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          900: "var(--piims-primary-900)",
          700: "var(--piims-primary-700)",
          500: "var(--piims-primary-500)",
          300: "var(--piims-primary-300)",
          100: "var(--piims-primary-100)",
        },
        accent: {
          500: "var(--piims-accent-500)",
          300: "var(--piims-accent-300)",
          100: "var(--piims-accent-100)",
        },
        success: "var(--piims-success)",
        warning: "var(--piims-warning)",
        danger: "var(--piims-danger)",
        info: "var(--piims-info)",
        neutral: {
          900: "var(--piims-neutral-900)",
          600: "var(--piims-neutral-600)",
          300: "var(--piims-neutral-300)",
          100: "var(--piims-neutral-100)",
          50: "var(--piims-neutral-50)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Ethiopic", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-1": ["32px", { lineHeight: "1.2", fontWeight: "800" }],
        h1: ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["18px", { lineHeight: "1.35", fontWeight: "700" }],
        h3: ["15px", { lineHeight: "1.4", fontWeight: "700" }],
        body: ["14px", { lineHeight: "1.5" }],
        "body-sm": ["13px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        overline: [
          "11px",
          { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.08em" },
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,.06)",
        md: "0 4px 12px rgba(0,0,0,.08)",
        lg: "0 8px 24px rgba(0,0,0,.12)",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
    },
  },
  plugins: [],
} satisfies Config;