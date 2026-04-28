import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#FF6B35",
        background: "#fcfbfa",
        foreground: "#171412",
        muted: "#5f5852",
        border: "#e7e0db",
        surface: "#fffdfa",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.03), 0 12px 28px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
