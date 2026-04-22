// handoff/src/components/pages/CMAPresentation.tsx
// Ported CMA detail view. Wire to: GET /api/cma?id=<cma_id>

import { useQuery } from "@tanstack/react-query";
import { Copy, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/los/SectionHead";
import { Placeholder } from "@/components/los/Placeholder";
import { tokens } from "@/components/los/tokens";

type CMAData = {
  address: string;
  subtitle: string;
  beds: number; baths: number; sqft: number; lot: number; yearBuilt: number; renovated?: number;
  recommendedPrice: string;
  rangeLow: string; rangeHigh: string;
  signals: { k: string; v: string; sub: string }[];
  adjustments: { f: string; v: string }[];
  netAdjustment: string;
  narrative: string;
  comps: { addr: string; dist: string; beds: number; ba: number; sqft: number; sold: string; pps: string; days: number; match: number }[];
};

const FALLBACK: CMAData = {
  address: "2847 Eastlake Avenue",
  subtitle: "Capitol Hill · Seattle, WA 98102",
  beds: 4, baths: 3.5, sqft: 3240, lot: 5800, yearBuilt: 1924, renovated: 2021,
  recommendedPrice: "$2,485,000",
  rangeLow: "$2.2M", rangeHigh: "$2.8M",
  signals: [
    { k: "Price per sqft", v: "$767", sub: "Comp avg $768 · ±0.1%" },
    { k: "Estimated DOM", v: "14", sub: "Zip median 21 days" },
    { k: "Walk score", v: "82", sub: "Very walkable" },
    { k: "Market strength", v: "Strong", sub: "ZHVI +4.1% YoY" },
  ],
  adjustments: [
    { f: "Kitchen renovation (2021)", v: "+$42,000" },
    { f: "Primary suite added",        v: "+$65,000" },
    { f: "1-car detached garage",      v: "-$18,000" },
    { f: "Lot size (5,800 vs 6,200)",  v: "-$12,000" },
    { f: "View premium (Lake Union)",  v: "+$85,000" },
    { f: "No AC",                      v: "-$8,000" },
  ],
  netAdjustment: "+$154,000",
  narrative:
    "Eastlake has quietly become one of Capitol Hill's strongest pockets this spring — inventory is down 18% versus this time last year, and ZHVI is up 4.1%. Four recent sales within a half-mile radius cluster tightly around $767 per square foot, with the freshest comp (2902 Eastlake) closing $35k over ask in 11 days. Given your 2021 kitchen and primary-suite addition, we'd recommend listing at $2,485,000 — a slight premium to the comps but well inside buyer expectations for this block, and it leaves meaningful headroom if you receive multiple offers.",
  comps: [
    { addr: "2902 Eastlake Ave E", dist: "0.1mi", beds: 4, ba: 3.5, sqft: 3180, sold: "$2,420K", pps: "$761", days: 18, match: 96 },
    { addr: "2615 Fairview Ave E", dist: "0.3mi", beds: 4, ba: 3,   sqft: 3310, sold: "$2,385K", pps: "$721", days: 22, match: 92 },
    { addr: "118 E Louisa St",     dist: "0.4mi", beds: 4, ba: 4,   sqft: 3050, sold: "$2,510K", pps: "$823", days: 14, match: 90 },
    { addr: "3201 Fuhrman Ave E",  dist: "0.5mi", beds: 3, ba: 3,   sqft: 2980, sold: "$2,295K", pps: "$770", days: 26, match: 85 },
  ],
};

async function fetchCMA(): Promise<CMAData> {
  try {
    const res = await fetch("/api/cma");
    if (!res.ok) throw new Error();
    const raw = await res.json();
    return { ...FALLBACK, ...raw };
  } catch {
    return FALLBACK;
  }
}

export default function CMAPresentation() {
  const { data = FALLBACK } = useQuery({ queryKey: ["cma"], queryFn: fetchCMA });
  const d = data;

  return (
    <div className="los-scroll h-full overflow-auto bg-background">
      {/* Breadcrumb */}
      <div className="h-11 border-b border-border flex items-center px-6 gap-4 text-xs text-muted-foreground">
        <span>Listingos</span><span>›</span><span>CMAs</span><span>›</span>
        <span className="text-foreground">{d.address}</span>
        <span className="ml-auto flex gap-2 items-center">
          <span className="los-mlabel flex items-center gap-1" style={{ color: tokens.ok }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: tokens.ok }} />
            Synced 2m ago
          </span>
          <Button size="sm" variant="outline"><FileDown className="mr-1 h-3 w-3" />Save PDF</Button>
          <Button size="sm">Share with seller</Button>
        </span>
      </div>

      <div className="px-10 py-7 pb-12">
        {/* Hero */}
        <div className="grid grid-cols-[1fr_320px] gap-10 pb-7 border-b border-border">
          <div>
            <div className="los-mlabel mb-2">Comparative Market Analysis · Draft 3</div>
            <h1 className="font-serif text-[40px] tracking-[-0.025em] leading-[1.05]">{d.address}</h1>
            <p className="font-serif italic text-[18px] mt-1 tracking-[-0.01em]" style={{ color: tokens.mute }}>{d.subtitle}</p>
            <div className="flex gap-7 mt-5 text-[12.5px] text-muted-foreground">
              <span><b className="text-foreground font-medium">{d.beds}</b> bedrooms</span>
              <span><b className="text-foreground font-medium">{d.baths}</b> bathrooms</span>
              <span><b className="text-foreground font-medium">{d.sqft.toLocaleString()}</b> sqft</span>
              <span><b className="text-foreground font-medium">{d.lot.toLocaleString()}</b> lot</span>
              <span><b className="text-foreground font-medium">{d.yearBuilt}</b>{d.renovated ? ` · reno'd ${d.renovated}` : ""}</span>
            </div>
          </div>
          <div className="p-6 rounded-[2px] relative" style={{ background: tokens.ink, color: tokens.paper }}>
            <div className="los-mlabel mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>Recommended list price</div>
            <div className="font-serif los-num text-[40px] tracking-[-0.025em] leading-none">{d.recommendedPrice}</div>
            <div className="text-[11.5px] mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>Confidence range {d.rangeLow} – {d.rangeHigh}</div>
            <div className="h-1 relative mt-4 rounded-[2px]" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div className="absolute inset-y-0" style={{ left: "20%", right: "20%", background: tokens.brass, borderRadius: 2 }} />
              <div className="absolute" style={{ left: "calc(50% - 1px)", top: -3, width: 2, height: 10, background: tokens.paper }} />
            </div>
            <div className="flex justify-between font-mono text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>{d.rangeLow}</span><span>{d.rangeHigh}</span>
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="grid grid-cols-4 border-b border-border">
          {d.signals.map((c, i) => (
            <div key={i} className="p-6" style={{ borderRight: i < 3 ? `1px solid ${tokens.line}` : "none" }}>
              <div className="los-mlabel mb-2">{c.k}</div>
              <div className="font-serif los-num text-[26px] tracking-[-0.02em]">{c.v}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Adjustments */}
        <div className="py-8 border-b border-border">
          <SectionHead eyebrow="Adjustment grid" title="Feature deltas" meta="Applied to 4 closest comps" />
          <div className="border border-border max-w-xl">
            {d.adjustments.map((r, i) => (
              <div key={i} className="flex justify-between p-3 text-[12.5px]"
                style={{ borderBottom: i < d.adjustments.length - 1 ? `1px solid ${tokens.line}` : "none" }}>
                <span>{r.f}</span>
                <span className="font-mono los-num" style={{ color: r.v.startsWith("+") ? tokens.ok : tokens.down }}>{r.v}</span>
              </div>
            ))}
            <div className="p-3 flex justify-between text-[12.5px] border-t border-border" style={{ background: tokens.cream }}>
              <span className="los-mlabel">Net adjustment</span>
              <span className="font-mono los-num font-medium" style={{ color: tokens.ok }}>{d.netAdjustment}</span>
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="py-8 border-b border-border">
          <SectionHead
            eyebrow="Pricing narrative · AI-drafted"
            title="What to tell the seller"
            right={<Button size="sm" variant="ghost"><Copy className="mr-1 h-3 w-3" />Copy</Button>}
          />
          <p className="font-serif text-[16px] leading-[1.6] max-w-3xl">
            {d.narrative}
          </p>
        </div>

        {/* Comps */}
        <div className="pt-8">
          <SectionHead
            eyebrow="Top 4 comps"
            title="Selected automatically, tunable"
            right={<Button size="sm" variant="outline">Adjust selection</Button>}
          />
          <div className="grid grid-cols-4 gap-4">
            {d.comps.map((c, i) => (
              <div key={i} className="border border-border overflow-hidden bg-card">
                <Placeholder label={`comp 0${i + 1}`} height={120} radius={0} />
                <div className="p-3.5">
                  <div className="flex justify-between items-baseline">
                    <div className="font-serif text-sm tracking-[-0.01em]">{c.addr}</div>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.dist}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.beds}bd · {c.ba}ba · {c.sqft.toLocaleString()} sqft</div>
                  <div className="flex justify-between items-baseline mt-2.5 pt-2.5 border-t border-border">
                    <div>
                      <div className="los-mlabel">Sold</div>
                      <div className="font-serif los-num text-base">{c.sold}</div>
                    </div>
                    <div className="text-right">
                      <div className="los-mlabel">$/sqft</div>
                      <div className="los-num text-[13px]">{c.pps}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex-1 h-[3px] rounded-[1px] overflow-hidden" style={{ background: tokens.stone }}>
                      <div className="h-full" style={{ width: `${c.match}%`, background: tokens.ink }} />
                    </div>
                    <span className="font-mono los-num text-[10px] text-muted-foreground">{c.match}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
