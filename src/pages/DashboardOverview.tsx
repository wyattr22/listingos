// handoff/src/components/pages/DashboardOverview.tsx
// Editorial dashboard layout, warm-paper palette.
// Wire to: GET /api/dashboard (uses your existing endpoint via TanStack Query).

import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Check, Plus, Sparkles, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Placeholder } from "@/components/los/Placeholder";
import { SectionHead } from "@/components/los/SectionHead";
import { Spark } from "@/components/los/Spark";
import { tokens } from "@/components/los/tokens";

// ───────────────────────────────────────────────────────────
// Adapter. Shape this to match whatever /api/dashboard returns.
// Keep hardcoded fallbacks so the page renders while you wire up.
// ───────────────────────────────────────────────────────────
type DashboardData = {
  agentFirstName: string;
  pipelineValue: string;
  pipelineDelta: string;
  focusListing: {
    address: string;
    neighborhood: string;
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
    renovated?: number;
    recommendedPrice: string;
    priceRange: string;
    pricePerSqft: string;
    compsAvgPps: string;
    daysToList: number;
    estDom: number;
    medianDom: number;
    checklist: { t: string; done: boolean }[];
  };
  today: { time: string; label: string; who: string; place: string; tag: string }[];
  pipeline: { name: string; count: number; value: string; deals: string[] }[];
  zips: { zip: string; name: string; pps: number; d: number; trend: number[]; delta: string }[];
};

const FALLBACK: DashboardData = {
  agentFirstName: "Maren",
  pipelineValue: "$14.2M",
  pipelineDelta: "+$2.1M vs last month",
  focusListing: {
    address: "2847 Eastlake Avenue",
    neighborhood: "Capitol Hill",
    beds: 4, baths: 3.5, sqft: 3240, yearBuilt: 1924, renovated: 2021,
    recommendedPrice: "$2,485,000", priceRange: "Range $2.38M – $2.59M",
    pricePerSqft: "$767", compsAvgPps: "Comps avg $742",
    daysToList: 3, estDom: 14, medianDom: 21,
    checklist: [
      { t: "CMA generated & reviewed", done: true },
      { t: "Listing description drafted", done: true },
      { t: "Photography scheduled — Fri 9am", done: true },
      { t: "Staging walkthrough with seller", done: false },
      { t: "MLS input sheet prepared", done: false },
    ],
  },
  today: [
    { time: "9:30 AM",  label: "CMA review", who: "Diane & Paul Okafor", place: "Zoom", tag: "Listing prep" },
    { time: "11:00 AM", label: "Showing",    who: "1428 W Emerson St",   place: "In person", tag: "Buyer · Ramirez" },
    { time: "2:15 PM",  label: "Photos",     who: "2847 Eastlake Ave",   place: "On site", tag: "Listing #2847" },
    { time: "4:45 PM",  label: "Offer call", who: "Seller — Hua",        place: "Phone", tag: "Negotiation" },
  ],
  pipeline: [
    { name: "Prospecting", count: 6, value: "$3.8M", deals: ["Eastlake", "Montlake", "Greenlake"] },
    { name: "CMA prep",    count: 3, value: "$2.1M", deals: ["W Emerson", "Boylston", "Federal"] },
    { name: "Active listing", count: 4, value: "$5.4M", deals: ["Harvard", "Fairview", "Latona"] },
    { name: "Under contract", count: 2, value: "$2.9M", deals: ["McGraw", "Louisa"] },
  ],
  zips: [
    { zip: "98102", name: "Eastlake",     pps: 742, d: 21, trend: [40,42,41,45,48,47,52,55], delta: "+3.2%" },
    { zip: "98112", name: "Capitol Hill", pps: 812, d: 18, trend: [50,48,52,51,54,58,60,62], delta: "+4.1%" },
    { zip: "98109", name: "Queen Anne",   pps: 698, d: 26, trend: [45,46,44,43,45,44,46,47], delta: "+0.8%" },
    { zip: "98105", name: "U District",   pps: 615, d: 19, trend: [38,40,39,41,40,39,37,36], delta: "-1.4%" },
  ],
};

async function fetchDashboard(): Promise<DashboardData> {
  try {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error();
    const raw = await res.json();
    // TODO: map raw → DashboardData shape once backend fields are finalized
    return { ...FALLBACK, ...raw };
  } catch {
    return FALLBACK;
  }
}

export default function DashboardOverview() {
  const { data = FALLBACK } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const d = data;

  return (
    <div className="los-scroll h-full overflow-auto bg-background px-10 py-7">
      {/* Greeting + pipeline */}
      <div className="flex justify-between items-end mb-7">
        <div>
          <div className="los-mlabel mb-2">Tuesday · Apr 22</div>
          <h1 className="font-serif text-[44px] leading-none tracking-[-0.025em]">
            Good morning, <em className="italic">{d.agentFirstName}</em>.
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-2.5 max-w-[560px]">
            Three listings need attention before tomorrow's tour. Your 9:30 CMA for the Eastlake property is ready to review.
          </p>
        </div>
        <div className="text-right">
          <div className="los-mlabel mb-1.5">Pipeline value</div>
          <div className="font-serif los-num text-[30px] tracking-tight">{d.pipelineValue}</div>
          <div className="text-[11.5px] mt-0.5 flex items-center gap-1 justify-end" style={{ color: tokens.ok }}>
            <ArrowUp size={10} /> {d.pipelineDelta}
          </div>
        </div>
      </div>

      {/* Focus listing */}
      <div className="grid grid-cols-[1.1fr_1fr] gap-8 py-7 border-y border-border mb-10">
        <div>
          <Placeholder label={`hero · ${d.focusListing.address.toLowerCase()}`} height={320} />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[1, 2, 3, 4].map(i => <Placeholder key={i} label={`img 0${i}`} height={60} />)}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="los-mlabel mb-2.5">Focus listing · Prep in progress</div>
          <h2 className="font-serif text-[28px] leading-[1.15] tracking-[-0.02em]">
            {d.focusListing.address}, <em className="italic">{d.focusListing.neighborhood}</em>
          </h2>
          <p className="text-[12.5px] text-muted-foreground mt-1.5">
            {d.focusListing.beds} bd · {d.focusListing.baths} ba · {d.focusListing.sqft.toLocaleString()} sqft · Built {d.focusListing.yearBuilt}{d.focusListing.renovated ? `, renovated ${d.focusListing.renovated}` : ""}
          </p>

          <div className="grid grid-cols-2 border-t border-border mt-5 mb-6">
            <StatCell k="Recommended price" v={d.focusListing.recommendedPrice} sub={d.focusListing.priceRange} border="right bottom" />
            <StatCell k="Price per sqft"    v={d.focusListing.pricePerSqft}     sub={d.focusListing.compsAvgPps} border="bottom" />
            <StatCell k="Days to list"      v={String(d.focusListing.daysToList)} sub="Photography Fri" border="right" />
            <StatCell k="Est. days on market" v={String(d.focusListing.estDom)} sub={`Zip median ${d.focusListing.medianDom}`} />
          </div>

          <div className="los-mlabel mb-2.5">Pre-listing checklist</div>
          <div className="flex flex-col">
            {d.focusListing.checklist.map((t, i, arr) => (
              <div key={i} className="flex items-center gap-2.5 py-2" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${tokens.line}` : "none" }}>
                <div className="w-[14px] h-[14px] rounded-[2px] flex items-center justify-center" style={{
                  border: `1px solid ${t.done ? tokens.ink : tokens.rule}`,
                  background: t.done ? tokens.ink : "transparent",
                }}>
                  {t.done && <Check size={9} color={tokens.paper} strokeWidth={2.5} />}
                </div>
                <span className="text-[12.5px] flex-1" style={{
                  color: t.done ? tokens.mute : tokens.ink,
                  textDecoration: t.done ? "line-through" : "none",
                }}>{t.t}</span>
                {!t.done && <span className="los-mlabel" style={{ color: tokens.brassDeep }}>Resume →</span>}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-5">
            <Button>Open listing workspace</Button>
            <Button variant="outline"><FileText className="mr-1.5 h-3 w-3" />Export CMA</Button>
          </div>
        </div>
      </div>

      {/* Today */}
      <div className="mb-10">
        <SectionHead
          eyebrow="Today · 4 items"
          title="On your calendar"
          right={<Button variant="ghost" size="sm">Open calendar <ChevronRight className="ml-1 h-3 w-3" /></Button>}
        />
        <div className="grid grid-cols-4 border border-border">
          {d.today.map((it, i) => (
            <div key={i} className="p-[18px]" style={{ borderRight: i < 3 ? `1px solid ${tokens.line}` : "none" }}>
              <div className="font-mono text-[11px] mb-2.5" style={{ color: tokens.brassDeep }}>{it.time}</div>
              <div className="font-serif text-[17px] tracking-[-0.015em] mb-1">{it.label}</div>
              <div className="text-xs">{it.who}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{it.place}</div>
              <div className="los-mlabel mt-3.5" style={{ color: tokens.brassDeep }}>{it.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-10">
        <SectionHead eyebrow="Pipeline" title="15 deals in flight" />
        <div className="grid grid-cols-4 gap-4">
          {d.pipeline.map((s, i) => (
            <div key={i} style={{ borderTop: `2px solid ${i === 3 ? tokens.ok : i === 2 ? tokens.ink : i === 1 ? tokens.brassDeep : tokens.mute}`, paddingTop: 14 }}>
              <div className="flex justify-between items-baseline">
                <div className="los-mlabel">{s.name}</div>
                <div className="font-mono los-num text-[11px] text-muted-foreground">{s.count}</div>
              </div>
              <div className="font-serif los-num text-[26px] tracking-[-0.02em] mt-2">{s.value}</div>
              <div className="mt-3.5 flex flex-col gap-2">
                {s.deals.map((n, j) => (
                  <div key={j} className="flex justify-between text-[11.5px] pb-1.5" style={{ borderBottom: `1px dashed ${tokens.line}` }}>
                    <span>{n}</span>
                    <span className="font-mono text-muted-foreground">·{(j + 2) * 3}d</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market pulse */}
      <div>
        <SectionHead
          eyebrow="Market pulse · 30 days"
          title="Your watched zips"
          meta="Sourced from Redfin, Zillow ZHVI/ZORI, ATTOM"
          right={<Button variant="ghost" size="sm">Add zip <Plus className="ml-1 h-3 w-3" /></Button>}
        />
        <div className="border border-border">
          {d.zips.map((z, i) => {
            const up = !z.delta.startsWith("-");
            return (
              <div key={i}
                className="grid items-center gap-[18px] px-5 py-3.5"
                style={{
                  gridTemplateColumns: "80px 1.2fr 0.8fr 0.8fr 1fr 0.6fr",
                  borderBottom: i < d.zips.length - 1 ? `1px solid ${tokens.line}` : "none",
                }}>
                <div className="font-mono los-num text-xs text-muted-foreground">{z.zip}</div>
                <div className="font-serif text-[15px] tracking-[-0.01em]">{z.name}</div>
                <div>
                  <div className="los-mlabel mb-1">$/sqft</div>
                  <div className="los-num text-sm">${z.pps}</div>
                </div>
                <div>
                  <div className="los-mlabel mb-1">Median DOM</div>
                  <div className="los-num text-sm">{z.d} days</div>
                </div>
                <Spark data={z.trend} w={160} h={28} color={up ? tokens.ok : tokens.down} />
                <div className="los-num text-[13px] text-right flex items-center gap-1 justify-end" style={{ color: up ? tokens.ok : tokens.down }}>
                  {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{z.delta}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCell({ k, v, sub, border = "" }: { k: string; v: string; sub: string; border?: string }) {
  return (
    <div className="p-[14px_16px]" style={{
      borderRight: border.includes("right") ? `1px solid ${tokens.line}` : "none",
      borderBottom: border.includes("bottom") ? `1px solid ${tokens.line}` : "none",
    }}>
      <div className="los-mlabel mb-1.5">{k}</div>
      <div className="font-serif los-num text-[22px] tracking-[-0.02em]">{v}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
