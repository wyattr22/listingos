import { useState, useRef } from "react";
import { Copy, Check, Loader2, Wand2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tokens } from "@/components/los/tokens";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { streamGenerate } from "@/lib/stream-chat";

type Facts = {
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot: string;
  yearBuilt: string;
  renovated: string;
  style: string;
  hoa: string;
};

const DEFAULT_FACTS: Facts = {
  address: "", beds: "", baths: "", sqft: "", lot: "",
  yearBuilt: "", renovated: "", style: "", hoa: "",
};

const FACT_LABELS: [keyof Facts, string][] = [
  ["address",   "Address"],
  ["beds",      "Beds"],
  ["baths",     "Baths"],
  ["sqft",      "Living area (sqft)"],
  ["lot",       "Lot (sqft)"],
  ["yearBuilt", "Year built"],
  ["renovated", "Renovated"],
  ["style",     "Style"],
  ["hoa",       "HOA"],
];

const DEFAULT_FEATURES = [
  "Updated kitchen", "Primary suite", "Hardwood floors", "Covered patio",
  "Attached garage", "Open floor plan", "Natural light", "Quiet street",
];

const TONES = ["Editorial", "Warm", "Direct", "Luxe"] as const;
const LENGTHS = ["Short", "Medium", "Long"] as const;
type Tone   = typeof TONES[number];
type Length = typeof LENGTHS[number];

function parseRaw(raw: string) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const title = lines[0] ?? "";
  const bullets: string[] = [];
  const body: string[] = [];
  for (const line of lines.slice(1)) {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      bullets.push(line.replace(/^[-•]\s*/, ""));
    } else {
      body.push(line);
    }
  }
  return { title, body: body.join("\n\n"), bullets };
}

export default function ListingGenerator() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [facts, setFacts]             = useState<Facts>(DEFAULT_FACTS);
  const [features, setFeatures]       = useState<string[]>([]);
  const [allFeatures, setAllFeatures] = useState<string[]>(DEFAULT_FEATURES);
  const [newFeature, setNewFeature]   = useState("");
  const [vibe, setVibe]               = useState("");
  const [tone, setTone]               = useState<Tone>("Editorial");
  const [length, setLength]           = useState<Length>("Medium");
  const [raw, setRaw]                 = useState("");
  const [loading, setLoading]         = useState(false);
  const [copied, setCopied]           = useState(false);
  const rawRef                        = useRef("");

  const toggleFeature = (f: string) =>
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const addCustomFeature = () => {
    const v = newFeature.trim();
    if (!v) return;
    if (!allFeatures.includes(v)) setAllFeatures(prev => [...prev, v]);
    if (!features.includes(v)) setFeatures(prev => [...prev, v]);
    setNewFeature("");
  };

  const generate = async () => {
    if (!facts.address.trim()) {
      toast({ title: "Enter a property address", variant: "destructive" });
      return;
    }
    const token = await getToken();
    if (!token) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    setLoading(true);
    rawRef.current = "";
    setRaw("");

    const featureStr = features.length ? features.join(", ") : "";
    const extraVibe = [
      facts.style     ? `Style: ${facts.style}`           : "",
      facts.yearBuilt ? `Built ${facts.yearBuilt}`         : "",
      facts.renovated ? `Renovated ${facts.renovated}`     : "",
      facts.lot       ? `Lot: ${facts.lot} sqft`           : "",
      facts.hoa       ? `HOA: ${facts.hoa}`                : "",
      vibe,
    ].filter(Boolean).join(". ");

    await streamGenerate({
      type: "listing",
      token,
      payload: {
        address:  facts.address,
        beds:     facts.beds || "N/A",
        baths:    facts.baths || "N/A",
        sqft:     facts.sqft || "N/A",
        features: featureStr,
        vibe:     extraVibe,
      },
      onDelta: (t) => { rawRef.current += t; setRaw(rawRef.current); },
      onDone:  () => setLoading(false),
      onError: (e) => { toast({ title: e, variant: "destructive" }); setLoading(false); },
    });
  };

  const copy = () => {
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { title, body, bullets } = parseRaw(raw);

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="h-11 border-b border-border flex items-center px-6 gap-4 text-xs text-muted-foreground shrink-0">
        <span>Listingos</span><span>›</span><span>Descriptions</span>
        {facts.address && <><span>›</span><span className="text-foreground">{facts.address}</span></>}
        <span className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={copy} disabled={!raw}>
            {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
            {copied ? "Copied" : "Copy all"}
          </Button>
        </span>
      </div>

      <div className="flex-1 grid grid-cols-[300px_1fr_300px] min-h-0">
        {/* Left: inputs */}
        <div className="border-r border-border overflow-auto p-5" style={{ scrollbarWidth: "none" }}>
          <div className="los-mlabel mb-2.5">Property Facts</div>
          <div className="border border-border mb-5">
            {FACT_LABELS.map(([key, label], i) => (
              <div key={key} className="flex items-center text-[11.5px]"
                style={{ borderBottom: i < FACT_LABELS.length - 1 ? `1px solid ${tokens.line}` : "none" }}>
                <span className="text-muted-foreground px-3 py-2 w-[110px] shrink-0">{label}</span>
                <input
                  className="flex-1 px-3 py-2 bg-transparent text-right text-[11.5px] outline-none placeholder:text-muted-foreground/40"
                  placeholder="—"
                  value={facts[key]}
                  onChange={e => setFacts(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="los-mlabel mb-2">Neighborhood / Vibe</div>
          <textarea
            className="w-full border border-border text-[11.5px] p-3 bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 mb-5"
            rows={2}
            placeholder="Walkable, near downtown, good schools, quiet block..."
            value={vibe}
            onChange={e => setVibe(e.target.value)}
          />

          <div className="los-mlabel mb-2.5">Features · click to tag</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {allFeatures.map((f) => {
              const on = features.includes(f);
              return (
                <span key={f} onClick={() => toggleFeature(f)}
                  className="text-[11px] px-2.5 py-1 cursor-pointer select-none"
                  style={{
                    background: on ? tokens.ink : "transparent",
                    color: on ? tokens.paper : tokens.mute,
                    border: `1px solid ${on ? tokens.ink : tokens.line}`,
                  }}>
                  {f}{on && " ×"}
                </span>
              );
            })}
          </div>
          <div className="flex gap-1.5 mb-5">
            <input
              className="flex-1 border border-border text-[11px] px-2.5 py-1.5 bg-transparent outline-none placeholder:text-muted-foreground/40"
              placeholder="Add feature..."
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomFeature()}
            />
            <button onClick={addCustomFeature}
              className="border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground">
              <Plus size={12} />
            </button>
          </div>

          <div className="los-mlabel mb-2.5">Tone</div>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {TONES.map(t => (
              <div key={t} onClick={() => setTone(t)}
                className="px-3 py-2 text-xs cursor-pointer font-serif tracking-[-0.01em]"
                style={{
                  border: `1px solid ${tone === t ? tokens.ink : tokens.line}`,
                  background: tone === t ? tokens.cream : tokens.paper,
                }}>{t}</div>
            ))}
          </div>

          <div className="los-mlabel mb-2.5">Length</div>
          <div className="flex gap-1.5 mb-5">
            {LENGTHS.map(l => (
              <div key={l} onClick={() => setLength(l)}
                className="flex-1 py-1.5 text-[11.5px] text-center cursor-pointer"
                style={{
                  border: `1px solid ${length === l ? tokens.ink : tokens.line}`,
                  background: length === l ? tokens.ink : tokens.paper,
                  color: length === l ? tokens.paper : tokens.ink,
                }}>{l}</div>
            ))}
          </div>

          <Button className="w-full justify-center" onClick={generate} disabled={loading}>
            {loading
              ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Generating…</>
              : <><Wand2 className="mr-1.5 h-3 w-3" />{raw ? "Regenerate" : "Generate listing"}</>}
          </Button>
        </div>

        {/* Center: output */}
        <div className="overflow-auto px-12 py-8" style={{ scrollbarWidth: "none" }}>
          {!raw && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="font-serif text-[22px] tracking-tight mb-3" style={{ color: tokens.mute }}>
                Your listing will appear here.
              </div>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Fill in the property facts, tag key features, then click Generate.
              </p>
            </div>
          )}

          {(raw || loading) && (
            <>
              <div className="los-mlabel mb-2">Draft · {tone} · {length}</div>
              {title && (
                <h1 className="font-serif text-[32px] tracking-[-0.02em] leading-[1.1] mb-6">{title}</h1>
              )}
              {loading && !body && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" /> Writing…
                </div>
              )}
              {body && (
                <div className="font-serif text-[15.5px] leading-[1.7] max-w-[620px] whitespace-pre-wrap mb-8">
                  {body}
                </div>
              )}
              {bullets.length > 0 && (
                <ul className="border-t border-border pt-5 space-y-2">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px]">
                      <span className="font-mono text-muted-foreground mt-0.5">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {raw && (
                <div className="mt-8 pt-4 border-t border-border flex gap-4 flex-wrap items-center">
                  <span className="los-mlabel">
                    Words <b className="text-foreground font-mono ml-1">{raw.split(/\s+/).filter(Boolean).length}</b>
                  </span>
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={copy}>
                      {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                      Copy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={generate} disabled={loading}>Regenerate</Button>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: tips */}
        <div className="border-l border-border overflow-auto p-6" style={{ scrollbarWidth: "none" }}>
          <div className="los-mlabel mb-2.5">Tips for better output</div>
          <div className="flex flex-col gap-2 mb-6">
            {[
              "Be specific — \"chef's kitchen with Thermador range\" beats \"updated kitchen\"",
              "Add neighborhood vibe — walkability, landmarks, commute notes",
              "Tag only genuinely notable features — less is more",
            ].map((tip, i) => (
              <div key={i} className="p-3 border border-border text-[11.5px] leading-relaxed text-muted-foreground">
                {tip}
              </div>
            ))}
          </div>

          <div className="los-mlabel mb-2.5">Phrases to avoid</div>
          <div className="flex flex-wrap gap-1.5">
            {['"must see"', '"hidden gem"', '"tons of potential"', '"won\'t last"', '"cozy"', '"charming"'].map(p => (
              <span key={p} className="text-[11px] px-2 py-0.5 border border-border line-through text-muted-foreground"
                style={{ background: tokens.cream }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
