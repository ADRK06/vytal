import type { Config } from "tailwindcss";

// TODO: fonts (Space Grotesk, IBM Plex Mono) still need to be wired up via next/font.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0E12",
        hydration: "#5EEAD4",
        posture: "#FF7A59",
        text: "#EDF2F1",
        "text-dim": "#8FA0A3",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
