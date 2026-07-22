/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#314855",
          sky: "#5cc3e8",
          sunshine: "#ffdb00",
          mint: "#79ceb8",
          coral: "#e95f5c",
          // Text-safe variants of sky/mint: a real Lighthouse audit found the
          // base brand-sky/brand-mint colors fail WCAG AA as text (2.01:1 and
          // 1.76:1 against white/stone-50; need 4.5:1). These darkened
          // variants keep the same hue for text-only use (buttons, labels,
          // active tab state) while backgrounds/icons keep using the base
          // brand colors, where contrast rules don't apply.
          "sky-text": "#0c6d92",
          "mint-text": "#1a6b50",
        },
        // Warm-neutral scale (slight navy tint, not pure gray) used for the
        // calm, restrained aesthetic across the redesigned pages instead of
        // Tailwind's default cool grays.
        stone: {
          50: "#faf9f7",
          100: "#f4f2ef",
          200: "#e8e6e1",
          300: "#d4d1ca",
          400: "#a8a49a",
          // 500/600 darkened from the original redesign values (#8593a0 /
          // #6b7a87) -- a real Lighthouse audit found both failed WCAG AA
          // (2.99:1 and 4.19:1 against stone-50/white; need 4.5:1) for
          // normal-size text. These pass with margin on both backgrounds
          // while keeping the same warm-navy hue.
          500: "#61707d",
          600: "#5c6f7c",
          700: "#4b5f6c",
          800: "#314855",
          900: "#24343e",
        },
      },
      fontSize: {
        // One shared type scale used consistently across all redesigned
        // pages, instead of each page picking its own ad hoc sizes.
        "display-lg": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
        "title-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "title": ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6" }],
        "body": ["0.9375rem", { lineHeight: "1.6" }],
        "caption": ["0.8125rem", { lineHeight: "1.5" }],
      },
      boxShadow: {
        // Soft, single-layer shadows -- restrained, not the heavy multi-layer
        // "glass glow" the old system used.
        "soft": "0 1px 2px rgba(49, 72, 85, 0.06), 0 1px 3px rgba(49, 72, 85, 0.08)",
        "soft-md": "0 2px 8px rgba(49, 72, 85, 0.08)",
        "soft-lg": "0 4px 16px rgba(49, 72, 85, 0.1)",
      },
      borderRadius: {
        "xl2": "1.25rem",
      },
    },
  },
  plugins: [],
};
