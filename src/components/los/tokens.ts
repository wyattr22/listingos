// handoff/src/components/los/tokens.ts
// Re-exportable design tokens. Use these in inline styles when you need a
// specific color that's not covered by a shadcn CSS variable (e.g. sparkline
// stroke, inline status dot). For most UI, prefer Tailwind utilities driven
// by the CSS variables in index.css.

export const tokens = {
  paper: "oklch(98% 0.006 85)",
  cream: "oklch(96% 0.01 85)",
  stone: "oklch(92% 0.008 85)",
  line:  "oklch(86% 0.008 85)",
  rule:  "oklch(78% 0.01 85)",
  mute:  "oklch(55% 0.008 80)",
  ink:   "oklch(22% 0.008 80)",
  deep:  "oklch(14% 0.006 80)",
  brass: "oklch(55% 0.055 85)",
  brassDeep: "oklch(42% 0.055 85)",
  ok:    "oklch(52% 0.06 160)",
  down:  "oklch(50% 0.09 25)",
} as const;

export type Tone = "paper" | "cream" | "ink" | "dark";
