import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "alice-blue": "#DAE8FB",
        thistle: "#F2D2FF",
        "pearl-aqua": "#75CBD1",
        "dusk-blue": "#3E5BA3",
        "deep-navy": "#0C0D45",
        "ivory-signal": "#FFF8E8",
        "mint-ledger": "#CFF7E8",
        "coral-caution": "#FF8D7A",
        "graphite-ink": "#151724",
        "soft-lavender-mist": "#F7ECFF",
        "aqua-shadow": "#2B8F99",
        "navy-glass": "#17185C",
      },
      fontFamily: {
        display: ["Norwester", "Arial Black", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        data: ["var(--font-data)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
