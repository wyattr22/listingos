import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  DollarSign,
  FileSearch,
  Search,
  Sparkles,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// ── Offer Strength logic ─────────────────────────────────────────────────────

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

const SectionHeader = ({ badge, title, description }: { badge: string; title: string; description: string }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
      {badge}
    </Badge>
    <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export const RealtorToolsSection = () => {
  const [activeTab, setActiveTab] = useState<"offer" | "price">("offer");

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="Realtor Tools"
        title="Built for Agents, Not Investors"
        description="Tools that match how you actually work — helping clients make confident decisions on price and offers."
      />

      {/* Tab switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-xl border bg-muted/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("offer")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "offer"
                ? "bg-background shadow-sm text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSearch className="h-4 w-4" />
            Offer Strength
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("price")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "price"
                ? "bg-background shadow-sm text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Listing Price Advisor
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "offer" ? (
          <motion.div key="offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <OfferStrengthTool />
          </motion.div>
        ) : (
          <motion.div key="price" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <ListingPriceTool />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const OfferStrengthTool = () => {
  const [listPrice, setListPrice] = useState("550000");
  const [offerPrice, setOfferPrice] = useState("560000");
  const [dom, setDom] = useState("5");
  const [competing, setCompeting] = useState<CompetingOffers>("few");
  const [result, setResult] = useState<OfferResult | null>(null);

  const analyze = () => {
    setResult(calcOfferStrength(Number(listPrice) || 0, Number(offerPrice) || 0, Number(dom) || 0, competing));
  };

  const strengthColor =
    result?.strength === "Strong"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : result?.strength === "Competitive"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-rose-500/40 bg-rose-500/5";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border-primary/20 bg-card/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Offer Details</CardTitle>
          <CardDescription>Enter the offer scenario to evaluate competitiveness.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">List Price</label>
              <Input type="number" min="0" placeholder="550000" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Offer Price</label>
              <Input type="number" min="0" placeholder="560000" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Days on Market</label>
              <Input type="number" min="0" placeholder="5" value={dom} onChange={(e) => setDom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Competing Offers</label>
              <Select value={competing} onValueChange={(v) => setCompeting(v as CompetingOffers)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="few">1–3</SelectItem>
                  <SelectItem value="many">4 or more</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={analyze} className="w-full" size="lg">
            Analyze Offer Strength
          </Button>
        </CardContent>
      </Card>

      <Card className={`border-2 transition-colors duration-300 ${result ? strengthColor : "border-border bg-card/70"}`}>
        <CardHeader>
          <CardTitle className="text-xl">Offer Scorecard</CardTitle>
          <CardDescription>Talking points and strategy for your client.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key={result.score} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Strength</p>
                    <p className={`text-xl font-bold mt-1 ${result.strength === "Strong" ? "text-emerald-600" : result.strength === "Competitive" ? "text-amber-600" : "text-rose-600"}`}>{result.strength}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Offer %</p>
                    <p className="text-xl font-bold mt-1">{result.offerPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Market</p>
                    <p className={`text-xl font-bold mt-1 ${result.marketTemp === "Hot" ? "text-rose-600" : result.marketTemp === "Warm" ? "text-amber-600" : "text-blue-600"}`}>{result.marketTemp}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.points.map((pt, i) => (
                    <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
                <div className={`rounded-xl border p-3 text-sm ${result.strength === "Strong" ? "border-emerald-500/30 bg-emerald-500/10" : result.strength === "Competitive" ? "border-amber-500/30 bg-amber-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                  <p className="font-medium">{result.recommendation}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                Fill in the offer details and click Analyze to get talking points.
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

const ListingPriceTool = () => {
  const [form, setForm] = useState({ beds: "3", baths: "2", sqft: "1800", condition: "Good", neighborhood: "", features: "" });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const analyze = () => {
    if (!form.neighborhood.trim() && !form.features.trim()) return;
    setLoading(true);
    setOutput("");
    setError("");
    void (async () => {
      try {
        const res = await fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "listingprice", ...form }),
        });
        const ct = res.headers.get("content-type") ?? "";
        if (!res.ok) {
          const d = ct.includes("json") ? await res.json() : {};
          setError((d as { error?: string }).error ?? "Could not generate advice. Try again.");
          return;
        }
        setOutput(await res.text());
      } catch {
        setError("Service temporarily unavailable. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border-primary/20 bg-card/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Property Details</CardTitle>
          <CardDescription>Enter the listing details to get an AI-powered price range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Beds</label>
              <Input type="number" min="0" value={form.beds} onChange={(e) => update("beds", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Baths</label>
              <Input type="number" min="0" value={form.baths} onChange={(e) => update("baths", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sq Ft</label>
              <Input type="number" min="0" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Condition</label>
            <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Needs Work">Needs Work</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Move-In Ready">Move-In Ready</SelectItem>
                <SelectItem value="Fully Renovated">Fully Renovated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Neighborhood / Location</label>
            <Input placeholder="Downtown Austin, near top-rated schools..." value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Features & Upgrades</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Updated kitchen, new roof, pool, corner lot..."
              value={form.features}
              onChange={(e) => update("features", e.target.value)}
            />
          </div>
          <Button onClick={analyze} disabled={loading} className="w-full" size="lg">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing..." : "Get Price Range"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-card/60">
        <CardHeader>
          <CardTitle className="text-xl">Price Recommendation</CardTitle>
          <CardDescription>AI-powered pricing advice based on property details.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                Analyzing market positioning...
              </motion.div>
            ) : (
              <motion.div key={output || error || "empty"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`min-h-[220px] rounded-xl border bg-background/70 p-4 text-sm leading-relaxed whitespace-pre-wrap ${error ? "text-destructive" : ""}`}>
                {error || output || "Fill in the property details and click Get Price Range to receive AI-powered pricing guidance."}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Evaluate the Property",
      description: "Plug in key details to instantly check offer competitiveness or get a data-backed price range.",
    },
    {
      icon: Bot,
      title: "Get AI-Powered Guidance",
      description: "Generate talking points, pricing recommendations, and polished listing copy in seconds.",
    },
    {
      icon: CheckCircle2,
      title: "Win More Clients & Close Faster",
      description: "Deliver professional advice and listings that build trust and turn leads into signed contracts.",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="How It Works"
        title="Three Steps to Faster Closings"
        description="From property discovery to polished marketing copy, Listing Os gives your team a clear workflow."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="h-full border-primary/15 bg-card/60 transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export const ListingGeneratorDemoSection = () => {
  const [details, setDetails] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const generateListing = () => {
    if (!details.trim()) return;
    setIsGenerating(true);
    setOutput("");
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features: details }),
        });
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok) {
          const data = contentType.includes("application/json") ? await response.json() : {};
          setError((data as { error?: string }).error ?? "Generation failed. Please try again.");
          return;
        }
        const text = await response.text();
        setOutput(text);
      } catch {
        setError("Generation temporarily unavailable. Please try again in a moment.");
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  return (
    <section id="listing-demo" className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="AI Listing Generator"
        title="See the Listing Generator in Action"
        description="Drop in basic property notes and generate polished MLS-ready copy with one click."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/15 bg-card/60">
          <CardHeader>
            <CardTitle className="text-xl">Property Details</CardTitle>
            <CardDescription>Paste raw notes or key property highlights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="min-h-[220px] resize-none"
              placeholder="Add bedrooms, bathrooms, location, amenities, and neighborhood details..."
            />
            <Button onClick={generateListing} disabled={isGenerating} size="lg" className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4" />
              Generate Listing
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-card/60">
          <CardHeader>
            <CardTitle className="text-xl">Generated Output</CardTitle>
            <CardDescription>AI-powered listing copy appears here.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed text-muted-foreground"
                >
                  Generating polished listing copy...
                </motion.div>
              ) : (
                <motion.div
                  key={output || error || "empty"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`min-h-[220px] rounded-xl border bg-background/70 p-4 leading-relaxed ${error ? "text-destructive" : ""}`}
                >
                  {error || output || "Click Generate Listing to preview your AI-crafted description."}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export const SocialProofSection = () => {
  const testimonials = [
    {
      name: "Maya Chen, Keller Group",
      quote: "Listing Os helped me cut listing prep time in half. I can now focus on clients, not copywriting.",
    },
    {
      name: "Derrick Holt, Holt Realty",
      quote: "The deal analyzer gives me a fast first-pass on every property. It has become part of my daily workflow.",
    },
    {
      name: "Sophia Miller, Riverstone Homes",
      quote: "Our team adopted it in one day. The listings sound polished, and our follow-up emails convert better.",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="Social Proof"
        title="Trusted by Growth-Minded Agents"
        description="Teams use Listing Os to evaluate opportunities, speed up listing prep, and close more confidently."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-6">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <p className="text-2xl font-bold">1,200+</p>
              <p className="text-sm text-muted-foreground">Listings generated</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-6">
            <CircleDollarSign className="h-6 w-6 text-primary" />
            <div>
              <p className="text-2xl font-bold">$10M+</p>
              <p className="text-sm text-muted-foreground">Deals analyzed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <Card className="h-full bg-card/70">
              <CardContent className="space-y-4 p-6">
                <p className="leading-relaxed text-muted-foreground">"{testimonial.quote}"</p>
                <p className="text-sm font-semibold">{testimonial.name}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export const PricingSection = () => {
  const [annualBilling, setAnnualBilling] = useState(false);
  const [selectedTier, setSelectedTier] = useState("Pro");
  const navigate = useNavigate();

  const tiers = [
    {
      name: "Free",
      monthlyPrice: 0,
      features: ["Offer Strength Estimator", "Listing Price Advisor", "Listing Generator (10/day)", "Follow-Up Email"],
    },
    {
      name: "Pro",
      monthlyPrice: 29,
      features: ["Everything in Free", "CMA Presentation Builder", "4-Email Drip Sequences", "Social Content Pack", "Saved History", "100 generations/day"],
      popular: true,
    },
    {
      name: "Team",
      monthlyPrice: 79,
      features: ["Everything in Pro", "500 generations/day", "Multi-agent access", "Priority support"],
    },
  ];

  const selected = tiers.find((t) => t.name === selectedTier)!;
  const displayPrice = annualBilling ? selected.monthlyPrice * 12 * 0.8 : selected.monthlyPrice;

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="Pricing"
        title="Simple Plans for Every Stage"
        description="Start free, scale as you grow, and give your team the tools to close faster."
      />

      <div className="mb-8 flex items-center justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setAnnualBilling(false)}
          className={`rounded px-1 transition-colors ${!annualBilling ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Monthly
        </button>
        <Switch checked={annualBilling} onCheckedChange={setAnnualBilling} aria-label="Toggle annual billing" />
        <button
          type="button"
          onClick={() => setAnnualBilling(true)}
          className={`rounded px-1 transition-colors ${annualBilling ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Annual
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Save 20%</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.name;
          return (
            <Card
              key={tier.name}
              onClick={() => setSelectedTier(tier.name)}
              className={`relative h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-[0_0_40px_hsl(42_80%_55%/0.18)] ring-2 ring-primary/40"
                  : "border-border bg-card/70 hover:border-primary/40"
              }`}
            >
              <CardHeader>
                {tier.popular && (
                  <Badge className="mb-3 w-fit" variant="default">
                    Most Popular
                  </Badge>
                )}
                <CardTitle className="text-2xl flex items-center justify-between">
                  {tier.name}
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {currencyFormatter.format(annualBilling ? tier.monthlyPrice * 12 * 0.8 : tier.monthlyPrice)}
                  </span>
                  <span className="text-muted-foreground">{annualBilling ? "/yr" : "/mo"}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="px-12 py-6 text-base shadow-[0_0_30px_hsl(42_80%_55%/0.2)] hover:shadow-[0_0_40px_hsl(42_80%_55%/0.3)] transition-shadow"
          onClick={() => navigate("/dashboard")}
        >
          Get Started with {selectedTier}
          {displayPrice > 0 && (
            <span className="ml-2 text-sm opacity-80">
              — {currencyFormatter.format(displayPrice)}{annualBilling ? "/yr" : "/mo"}
            </span>
          )}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">No credit card required to start free.</p>
      </div>
    </section>
  );
};

export const FAQSection = () => {
  const faqs = [
    {
      value: "item-1",
      question: "Do I need to connect my MLS to start?",
      answer: "No. You can start with simple property assumptions and notes, then add integrations later as your workflow grows.",
    },
    {
      value: "item-2",
      question: "How accurate is the Deal Analyzer?",
      answer:
        "It gives an instant first-pass based on your numbers. It is designed for rapid screening before deeper underwriting and due diligence.",
    },
    {
      value: "item-3",
      question: "Can my team collaborate in one account?",
      answer: "Yes. Team plans support multi-user collaboration, shared deal pipelines, and visibility across your agents.",
    },
    {
      value: "item-4",
      question: "Can I cancel anytime?",
      answer: "Absolutely. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="FAQ"
        title="Answers to Common Questions"
        description="Everything you need to know before rolling Listing Os into your daily deal workflow."
      />

      <Card className="mx-auto max-w-3xl bg-card/70">
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem value={faq.value} key={faq.value}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
};

export const FinalCTASection = () => {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    document.getElementById("listing-demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-6 pb-28 pt-10 md:pb-24">
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center md:p-12">
          <Badge className="bg-primary/15 text-primary" variant="secondary">
            Ready to close more deals?
          </Badge>
          <h3 className="max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            Start free today and turn every property into a better decision.
          </h3>
          <p className="max-w-xl text-muted-foreground">
            Analyze opportunities faster, generate polished listings instantly, and keep momentum from first look to final close.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToDemo}>
              View Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export const StickyMobileCTA = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur-sm md:hidden">
      <Button className="w-full" size="lg" onClick={() => navigate("/dashboard")}>
        Start Free <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
