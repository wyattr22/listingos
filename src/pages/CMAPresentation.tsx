import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Plus, Trash2, Printer, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGenerateCMA } from "@/hooks/use-saas-api";
import { ProGate } from "@/components/ProGate";
import type { CMAOutput, CMAComp } from "../../lib/gemini-generate-server";

const emptyComp = (): CMAComp => ({ address: "", beds: "", baths: "", sqft: "", salePrice: "", saleDate: "", notes: "" });

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ── Presentation View ─────────────────────────────────────────────────────────

const PresentationView = ({
  output, property, comps, onBack,
}: {
  output: CMAOutput;
  property: { address: string; beds: string; baths: string; sqft: string; condition: string; features: string; agentName: string; brokerage: string };
  comps: CMAComp[];
  onBack: () => void;
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body * { visibility: hidden; }
          #cma-print, #cma-print * { visibility: visible; }
          #cma-print { position: absolute; left: 0; top: 0; width: 100%; }
          .print-section { break-after: page; }
          .print-section:last-child { break-after: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Edit
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>
      </div>

      <div id="cma-print" ref={printRef} className="space-y-0">
        {/* Cover */}
        <div className="print-section min-h-[500px] rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background p-12 flex flex-col justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Comparative Market Analysis</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{property.address}</h1>
            <p className="text-muted-foreground text-lg">
              {[property.beds && `${property.beds} Bed`, property.baths && `${property.baths} Bath`, property.sqft && `${property.sqft} Sq Ft`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-end justify-between mt-10">
            <div>
              {property.agentName && <p className="font-semibold text-lg">{property.agentName}</p>}
              {property.brokerage && <p className="text-muted-foreground">{property.brokerage}</p>}
            </div>
            <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="print-section mb-8">
          <SectionBlock title="Executive Summary" accent>
            <p className="text-foreground/90 leading-relaxed text-lg">{output.executiveSummary}</p>
          </SectionBlock>
        </div>

        {/* Subject Property */}
        <div className="print-section mb-8">
          <SectionBlock title="Subject Property">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[["Bedrooms", property.beds], ["Bathrooms", property.baths], ["Square Feet", property.sqft], ["Condition", property.condition]].map(([label, val]) =>
                val ? <StatBox key={label} label={label} value={val} /> : null
              )}
            </div>
            {property.features && <p className="text-sm text-muted-foreground mt-2"><span className="font-medium">Features:</span> {property.features}</p>}
          </SectionBlock>
        </div>

        {/* Comparable Sales */}
        <div className="print-section mb-8">
          <SectionBlock title="Comparable Sales">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Address", "Bed/Bath", "Sq Ft", "Sale Price", "Date", "Notes"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.address}</td>
                      <td className="py-2 pr-4">{c.beds}/{c.baths}</td>
                      <td className="py-2 pr-4">{c.sqft}</td>
                      <td className="py-2 pr-4 font-semibold text-primary">{c.salePrice}</td>
                      <td className="py-2 pr-4">{c.saleDate}</td>
                      <td className="py-2 text-muted-foreground">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionBlock>
        </div>

        {/* Market Overview */}
        <div className="print-section mb-8">
          <SectionBlock title="Market Overview">
            <p className="text-foreground/90 leading-relaxed">{output.marketOverview}</p>
          </SectionBlock>
        </div>

        {/* Comp Analysis */}
        <div className="print-section mb-8">
          <SectionBlock title="Comparative Analysis">
            <p className="text-foreground/90 leading-relaxed">{output.compAnalysis}</p>
          </SectionBlock>
        </div>

        {/* Pricing Recommendation */}
        <div className="print-section mb-8">
          <SectionBlock title="Pricing Recommendation" accent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lower Bound</p>
                <p className="text-2xl font-bold">{fmt(output.recommendedPriceLow)}</p>
              </div>
              <div className="rounded-xl border-2 border-primary bg-primary/10 p-5 text-center shadow-[0_0_30px_hsl(42_80%_55%/0.15)]">
                <p className="text-xs text-primary uppercase tracking-wide mb-1 font-semibold">Recommended</p>
                <p className="text-3xl font-bold text-primary">{fmt(output.recommendedPrice)}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Upper Bound</p>
                <p className="text-2xl font-bold">{fmt(output.recommendedPriceHigh)}</p>
              </div>
            </div>
            <p className="text-foreground/90 leading-relaxed">{output.pricingRationale}</p>
          </SectionBlock>
        </div>

        {/* Marketing Strategy */}
        <div className="print-section mb-8">
          <SectionBlock title="Marketing Strategy">
            <p className="text-foreground/90 leading-relaxed">{output.marketingStrategy}</p>
          </SectionBlock>
        </div>

        {/* Key Talking Points */}
        <div className="print-section mb-8">
          <SectionBlock title="Key Talking Points">
            <div className="space-y-3">
              {output.keyTalkingPoints.map((pt, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-foreground/90">{pt}</p>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>
      </div>
    </div>
  );
};

const SectionBlock = ({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) => (
  <div className={`rounded-2xl border p-6 md:p-8 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-card/60"}`}>
    <h2 className="text-xl font-bold mb-4 text-primary">{title}</h2>
    {children}
  </div>
);

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border bg-background/60 p-3 text-center">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const CMAPresentation = () => {
  const { toast } = useToast();
  const generateCMA = useGenerateCMA();
  const [result, setResult] = useState<{ output: CMAOutput; id: string } | null>(null);

  const [property, setProperty] = useState({
    address: "", beds: "", baths: "", sqft: "",
    condition: "Good", features: "", agentName: "", brokerage: "",
  });
  const [comps, setComps] = useState<CMAComp[]>([emptyComp(), emptyComp(), emptyComp()]);

  const updateProp = (k: string, v: string) => setProperty(p => ({ ...p, [k]: v }));
  const updateComp = (i: number, k: keyof CMAComp, v: string) =>
    setComps(cs => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const addComp = () => comps.length < 6 && setComps(cs => [...cs, emptyComp()]);
  const removeComp = (i: number) => comps.length > 2 && setComps(cs => cs.filter((_, idx) => idx !== i));

  const generate = async () => {
    if (!property.address) { toast({ title: "Enter the subject property address", variant: "destructive" }); return; }
    const validComps = comps.filter(c => c.address && c.salePrice);
    if (validComps.length < 2) { toast({ title: "Add at least 2 comparable sales with address and price", variant: "destructive" }); return; }
    try {
      const data = await generateCMA.mutateAsync({ property, comps: validComps });
      setResult({ output: data.output, id: data.id });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to generate CMA", variant: "destructive" });
    }
  };

  if (result) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
          <PresentationView output={result.output} property={property} comps={comps.filter(c => c.address && c.salePrice)} onBack={() => setResult(null)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <ProGate>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">CMA Presentation Builder</h1>
          </div>
          <p className="text-muted-foreground">Enter the subject property and comparable sales to generate a professional, printable CMA presentation.</p>
        </div>

        {/* Subject Property */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Subject Property</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Property Address</Label>
              <Input placeholder="123 Maple St, Austin, TX 78701" value={property.address} onChange={e => updateProp("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Beds</Label><Input type="number" placeholder="3" value={property.beds} onChange={e => updateProp("beds", e.target.value)} /></div>
              <div><Label>Baths</Label><Input type="number" placeholder="2" value={property.baths} onChange={e => updateProp("baths", e.target.value)} /></div>
              <div><Label>Sq Ft</Label><Input type="number" placeholder="1800" value={property.sqft} onChange={e => updateProp("sqft", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Condition</Label>
                <Select value={property.condition} onValueChange={v => updateProp("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Needs Work">Needs Work</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Move-In Ready">Move-In Ready</SelectItem>
                    <SelectItem value="Fully Renovated">Fully Renovated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Key Features</Label>
              <Textarea placeholder="Updated kitchen, pool, corner lot, new roof..." rows={2} value={property.features} onChange={e => updateProp("features", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Agent Name (optional)</Label><Input placeholder="Your name" value={property.agentName} onChange={e => updateProp("agentName", e.target.value)} /></div>
              <div><Label>Brokerage (optional)</Label><Input placeholder="Keller Williams, etc." value={property.brokerage} onChange={e => updateProp("brokerage", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Comparable Sales */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comparable Sales</h2>
            {comps.length < 6 && (
              <Button variant="outline" size="sm" onClick={addComp}>
                <Plus className="h-4 w-4 mr-1" /> Add Comp
              </Button>
            )}
          </div>
          {comps.map((comp, i) => (
            <Card key={i} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Comp {i + 1}</CardTitle>
                  {comps.length > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => removeComp(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <Label>Address</Label>
                  <Input placeholder="456 Oak Ave, Austin, TX" value={comp.address} onChange={e => updateComp(i, "address", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sale Price</Label><Input placeholder="$525,000" value={comp.salePrice} onChange={e => updateComp(i, "salePrice", e.target.value)} /></div>
                  <div><Label>Sale Date</Label><Input placeholder="Jan 2025" value={comp.saleDate} onChange={e => updateComp(i, "saleDate", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Beds</Label><Input placeholder="3" value={comp.beds} onChange={e => updateComp(i, "beds", e.target.value)} /></div>
                  <div><Label>Baths</Label><Input placeholder="2" value={comp.baths} onChange={e => updateComp(i, "baths", e.target.value)} /></div>
                  <div><Label>Sq Ft</Label><Input placeholder="1750" value={comp.sqft} onChange={e => updateComp(i, "sqft", e.target.value)} /></div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Similar updates, smaller lot..." value={comp.notes} onChange={e => updateComp(i, "notes", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={generate} disabled={generateCMA.isPending} className="w-full py-6 text-base">
          {generateCMA.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Presentation...</> : "Generate CMA Presentation"}
        </Button>
      </motion.div>
    </ProGate>
  );
};

export default CMAPresentation;
