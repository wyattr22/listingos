import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OfferStrength = "Weak" | "Competitive" | "Strong";
type MarketTemp = "Cool" | "Warm" | "Hot";
type CompetingOffers = "none" | "few" | "many";

type OfferResult = {
  strength: OfferStrength;
  marketTemp: MarketTemp;
  offerPct: number;
  score: number;
  points: string[];
  recommendation: string;
};

function calcOfferStrength(
  listPrice: number,
  offerPrice: number,
  dom: number,
  competing: CompetingOffers,
): OfferResult {
  const offerPct = listPrice > 0 ? offerPrice / listPrice : 1;
  const marketTemp: MarketTemp = dom <= 7 ? "Hot" : dom <= 21 ? "Warm" : "Cool";

  let score =
    offerPct >= 1.05 ? 90
    : offerPct >= 1.02 ? 75
    : offerPct >= 1.00 ? 60
    : offerPct >= 0.97 ? 42
    : offerPct >= 0.95 ? 28
    : 14;

  if (marketTemp === "Hot") score = Math.min(100, score + 10);
  if (marketTemp === "Cool") score = Math.max(0, score - 10);
  if (competing !== "none" && offerPct < 1.0) {
    score = Math.max(0, score - (competing === "many" ? 25 : 12));
  }

  const strength: OfferStrength = score >= 70 ? "Strong" : score >= 40 ? "Competitive" : "Weak";
  const points: string[] = [];
  const diffPct = ((offerPct - 1) * 100).toFixed(1);

  if (offerPct > 1) {
    points.push(`Offering ${diffPct}% above asking demonstrates commitment and reduces the risk of being outbid.`);
  } else if (offerPct === 1) {
    points.push("A full-price offer is clean and respected — shows the buyer is serious without over-bidding.");
  } else {
    points.push(`Offering ${Math.abs(Number(diffPct))}% below asking — pair this with a strong pre-approval letter and flexible closing date.`);
  }

  if (marketTemp === "Hot") {
    points.push(`Property has been on market only ${dom} day${dom === 1 ? "" : "s"} — expect competition and move quickly.`);
  } else if (marketTemp === "Cool") {
    points.push(`${dom} days on market suggests room to negotiate. Consider asking for closing cost credits or repairs.`);
  } else {
    points.push("Moderate days on market — the seller is motivated but not desperate. Standard terms should land.");
  }

  if (competing === "many") {
    points.push("With 4+ offers competing, an escalation clause up to a firm cap can win without overpaying blindly.");
  } else if (competing === "few") {
    points.push("A few competing offers — minimize contingencies and keep the offer clean to stand out.");
  } else {
    points.push("No competing offers reported — your client has leverage. Don't be afraid to negotiate terms.");
  }

  const recommendation =
    strength === "Strong"
      ? "This offer is well-positioned. Present with confidence and a pre-approval letter."
      : strength === "Competitive"
      ? "Solid offer but not a lock. Tighten terms or increase price slightly to improve chances."
      : "This offer is unlikely to succeed as-is. Recommend revising the price or terms before submitting.";

  return { strength, marketTemp, offerPct: offerPct * 100, score, points, recommendation };
}

const OfferStrengthEstimator = () => {
  const [listPrice, setListPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [dom, setDom] = useState("");
  const [competing, setCompeting] = useState<CompetingOffers>("none");
  const [result, setResult] = useState<OfferResult | null>(null);

  const analyze = () => {
    if (!listPrice || !offerPrice) return;
    setResult(calcOfferStrength(Number(listPrice), Number(offerPrice), Number(dom) || 0, competing));
  };

  const strengthColor =
    result?.strength === "Strong"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : result?.strength === "Competitive"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-rose-500/40 bg-rose-500/5";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Offer Strength Estimator</h1>
        </div>
        <p className="text-muted-foreground">Evaluate how competitive a buyer's offer is and get talking points to present with confidence.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>List Price</Label>
              <Input type="number" min="0" placeholder="550000" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
            </div>
            <div>
              <Label>Offer Price</Label>
              <Input type="number" min="0" placeholder="565000" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Days on Market</Label>
              <Input type="number" min="0" placeholder="7" value={dom} onChange={(e) => setDom(e.target.value)} />
            </div>
            <div>
              <Label>Competing Offers</Label>
              <Select value={competing} onValueChange={(v) => setCompeting(v as CompetingOffers)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None known</SelectItem>
                  <SelectItem value="few">1–3 offers</SelectItem>
                  <SelectItem value="many">4 or more</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={analyze} disabled={!listPrice || !offerPrice} className="w-full py-6">
            Analyze Offer Strength
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`border-2 ${strengthColor}`}>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Strength</p>
                    <p className={`text-2xl font-bold mt-1 ${result.strength === "Strong" ? "text-emerald-600" : result.strength === "Competitive" ? "text-amber-600" : "text-rose-600"}`}>{result.strength}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Offer %</p>
                    <p className="text-2xl font-bold mt-1">{result.offerPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Market</p>
                    <p className={`text-2xl font-bold mt-1 ${result.marketTemp === "Hot" ? "text-rose-600" : result.marketTemp === "Warm" ? "text-amber-600" : "text-blue-600"}`}>{result.marketTemp}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-3">Talking Points</h3>
                  <div className="space-y-2">
                    {result.points.map((pt, i) => (
                      <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-xl border p-4 text-sm font-medium ${result.strength === "Strong" ? "border-emerald-500/30 bg-emerald-500/10" : result.strength === "Competitive" ? "border-amber-500/30 bg-amber-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                  {result.recommendation}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OfferStrengthEstimator;
