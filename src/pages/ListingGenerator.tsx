// handoff/src/components/pages/ListingGenerator.tsx
// Three-pane description generator. Wire to POST /api/listing-generator.

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tokens } from "@/components/los/tokens";

type Draft = { title: string; body: string[]; wordCount: number; readingGrade: number };

const FALLBACK_DRAFT: Draft = {
  title: "A Craftsman, quietly reimagined, above Lake Union.",
  body: [
    "Set on a quiet block above Eastlake, this four-bedroom 1924 Craftsman was thoughtfully restored in 2021 — original fir floors and period millwork preserved, with a new chef's kitchen and full primary suite added upstairs.",
    "Morning light fills the kitchen through a south-facing bay; by afternoon it moves across the covered patio and into the back garden. A detached one-car garage sits off the alley. The home lives larger than its 3,240 square feet suggests.",
    "The second floor now houses a true owner's retreat — walk-in wardrobe, spa bath, and a west-facing window with a framed view of Lake Union. Three additional bedrooms and a shared full bath complete the upper floor.",
    "Walk to Eastlake's cafés in five minutes, or to Capitol Hill in fifteen. Moments to I-5, Amazon, and South Lake Union without any of the noise.",
  ],
  wordCount: 184, readingGrade: 9.2,
};

const FACTS: [string, string][] = [
  ["Address", "2847 Eastlake Ave"],
  ["Beds / Baths", "4 / 3.5"],
  ["Living area", "3,240 sqft"],
  ["Lot", "5,800 sqft"],
  ["Year built", "1924"],
  ["Renovated", "2021"],
  ["Style", "Craftsman"],
  ["HOA", "None"],
];

const FEATURES: [string, boolean][] = [
  ["Lake Union view", true], ["Chef kitchen", true], ["Primary suite", true],
  ["Detached garage", true], ["Covered patio", true], ["Wine cellar", false],
  ["Heated floors", false], ["Quiet street", true], ["Walk to Eastlake", true],
  ["Original fir floors", true],
];

export default function ListingGenerator() {
  const [tone, setTone] = useState("Editorial");
  const [length, setLength] = useState("Medium");
  const [draft, setDraft] = useState<Draft>(FALLBACK_DRAFT);

  const gen = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/listing-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tone, length, facts: FACTS, features: FEATURES.filter(f => f[1]).map(f => f[0]) }),
      });
      if (!res.ok) throw new Error();
      return (await res.json()) as Draft;
    },
    onSuccess: (d) => setDraft(d),
  });

  return (
    <div className="los h-full overflow-hidden bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="h-11 border-b border-border flex items-center px-6 gap-4 text-xs text-muted-foreground">
        <span>Listingos</span><span>›</span><span>Descriptions</span><span>›</span>
        <span className="text-foreground">2847 Eastlake Ave · Draft 2</span>
        <span className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost">History</Button>
          <Button size="sm" variant="outline">Copy all</Button>
          <Button size="sm">Push to MLS</Button>
        </span>
      </div>

      <div className="flex-1 grid grid-cols-[320px_1fr_320px] min-h-0">
        {/* Left: inputs */}
        <div className="los-scroll border-r border-border overflow-auto p-6">
          <div className="los-mlabel mb-2.5">Facts · pulled from MLS</div>
          <div className="border border-border">
            {FACTS.map((r, i) => (
              <div key={i} className="flex justify-between px-3 py-2.5 text-[11.5px]"
                style={{ borderBottom: i < FACTS.length - 1 ? `1px solid ${tokens.line}` : "none" }}>
                <span className="text-muted-foreground">{r[0]}</span>
                <span className="font-medium">{r[1]}</span>
              </div>
            ))}
          </div>

          <div className="los-mlabel mt-5 mb-2.5">Features · tag what matters</div>
          <div className="flex flex-wrap gap-1.5">
            {FEATURES.map(([t, on], i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-[2px] cursor-pointer"
                style={{
                  background: on ? tokens.ink : "transparent",
                  color: on ? tokens.paper : tokens.mute,
                  border: `1px solid ${on ? tokens.ink : tokens.line}`,
                }}>{t}{on && " ×"}</span>
            ))}
          </div>

          <div className="los-mlabel mt-5 mb-2.5">Tone</div>
          <div className="grid grid-cols-2 gap-1.5">
            {["Editorial", "Warm", "Direct", "Luxe"].map(t => (
              <div key={t} onClick={() => setTone(t)} className="px-3 py-2 text-xs cursor-pointer font-serif tracking-[-0.01em]"
                style={{
                  border: `1px solid ${tone === t ? tokens.ink : tokens.line}`,
                  background: tone === t ? tokens.cream : tokens.paper,
                }}>{t}</div>
            ))}
          </div>

          <div className="los-mlabel mt-4 mb-2.5">Length</div>
          <div className="flex gap-1.5">
            {["Short", "Medium", "Long"].map(l => (
              <div key={l} onClick={() => setLength(l)} className="flex-1 py-1.5 text-[11.5px] text-center cursor-pointer"
                style={{
                  border: `1px solid ${length === l ? tokens.ink : tokens.line}`,
                  background: length === l ? tokens.ink : tokens.paper,
                  color: length === l ? tokens.paper : tokens.ink,
                }}>{l}</div>
            ))}
          </div>

          <Button className="w-full mt-5 justify-center" onClick={() => gen.mutate()} disabled={gen.isPending}>
            <Wand2 className="mr-1.5 h-3 w-3" />{gen.isPending ? "Generating…" : "Regenerate draft"}
          </Button>
        </div>

        {/* Center: output */}
        <div className="los-scroll overflow-auto px-12 py-8">
          <div className="los-mlabel mb-2">Draft · {tone} · {length}</div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] leading-[1.1]">{draft.title}</h1>
          <div className="mt-6 font-serif text-[15.5px] leading-[1.7] max-w-[620px]">
            {draft.body.map((p, i) => <p key={i} className={i > 0 ? "mt-4" : ""}>{p}</p>)}
          </div>
          <div className="mt-8 pt-4 border-t border-border flex gap-6 flex-wrap items-center">
            <span className="los-mlabel">Word count <b className="text-foreground font-mono ml-1">{draft.wordCount}</b></span>
            <span className="los-mlabel">Reading grade <b className="text-foreground font-mono ml-1">{draft.readingGrade}</b></span>
            <span className="los-mlabel">MLS fit <b className="font-mono ml-1" style={{ color: tokens.ok }}>✓ 2000 char</b></span>
            <span className="los-mlabel">Fair housing <b className="font-mono ml-1" style={{ color: tokens.ok }}>✓ clean</b></span>
            <span className="ml-auto flex gap-1.5">
              <Button size="sm" variant="ghost"><Copy className="mr-1 h-3 w-3" />Copy</Button>
              <Button size="sm" variant="ghost">Make shorter</Button>
              <Button size="sm" variant="ghost">More lyrical</Button>
            </span>
          </div>
        </div>

        {/* Right: suggestions */}
        <div className="los-scroll border-l border-border overflow-auto p-6">
          <div className="los-mlabel mb-2.5">Alternate openers</div>
          {[
            "Above the clatter of Eastlake, a restored 1924 Craftsman.",
            "Four bedrooms, Lake Union light, and original fir floors.",
            "A corner of Capitol Hill that still feels like a neighborhood.",
          ].map((o, i) => (
            <div key={i} className="p-3 border border-border font-serif text-[12.5px] leading-snug mb-2 cursor-pointer">
              "{o}"
              <div className="los-mlabel mt-2" style={{ color: tokens.brassDeep }}>Use this opener →</div>
            </div>
          ))}

          <div className="los-mlabel mt-5 mb-2.5">Phrases to avoid</div>
          <div className="flex flex-wrap gap-1.5">
            {['"must see"', '"hidden gem"', '"tons of potential"', '"won\'t last"'].map(p => (
              <span key={p} className="text-[11px] px-2 py-0.5 border border-border line-through text-muted-foreground" style={{ background: tokens.cream }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
