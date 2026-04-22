// handoff/src/components/los/Spark.tsx
// Tiny inline sparkline. For full charts, keep using recharts.

interface Props {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}

export function Spark({ data, w = 96, h = 26, color = "currentColor", fill = true }: Props) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / rng) * (h - 3) - 1.5;
    return [x, y] as const;
  });
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = d + ` L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} className="block">
      {fill && <path d={area} fill={color} opacity={0.08} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} />
    </svg>
  );
}
