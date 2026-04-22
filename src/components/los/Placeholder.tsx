// handoff/src/components/los/Placeholder.tsx
// Striped placeholder for imagery that isn't available yet. Swap for a real
// <img> sourced from Supabase Storage once you wire photos.

import { cn } from "@/lib/utils";

interface PlaceholderProps {
  label?: string;
  height?: number | string;
  tone?: "cream" | "ink" | "dark";
  radius?: number;
  className?: string;
}

export function Placeholder({
  label = "property photo",
  height = 180,
  tone = "cream",
  radius = 2,
  className,
}: PlaceholderProps) {
  const isDark = tone === "dark" || tone === "ink";
  const bg = tone === "dark" ? "oklch(14% 0.006 80)" : tone === "ink" ? "oklch(22% 0.008 80)" : "oklch(96% 0.01 85)";
  const stripe = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const txt = isDark ? "rgba(255,255,255,0.45)" : "oklch(55% 0.008 80)";
  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden relative", className)}
      style={{
        height,
        background: bg,
        borderRadius: radius,
        backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 1px, transparent 1px 9px)`,
      }}
    >
      <span className="font-mono uppercase tracking-[0.12em]" style={{ fontSize: 10, color: txt }}>
        {label}
      </span>
    </div>
  );
}
