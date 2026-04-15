import { type FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type DealScore = {
  cashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  riskScore: number;
  marketScore: number;
  overallScore: number;
  recommendation: "BUY" | "WATCH" | "PASS";
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const calculateDealScore = (values: {
  purchasePrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
}): DealScore => {
  const loanAmount = Math.max(0, values.purchasePrice - values.downPayment);
  const monthlyRate = 0.065 / 12;
  const payments = 30 * 12;
  const factor = Math.pow(1 + monthlyRate, payments);
  const mortgageEstimate = loanAmount > 0 ? (loanAmount * monthlyRate * factor) / (factor - 1) : 0;

  const cashFlow = values.monthlyRent - values.monthlyExpenses - mortgageEstimate;
  const annualNetIncome = (values.monthlyRent - values.monthlyExpenses) * 12;
  const annualCashFlow = cashFlow * 12;
  const capRate = values.purchasePrice > 0 ? (annualNetIncome / values.purchasePrice) * 100 : 0;
  const cashOnCashReturn = values.downPayment > 0 ? (annualCashFlow / values.downPayment) * 100 : 0;

  const leverageRatio = values.purchasePrice > 0 ? loanAmount / values.purchasePrice : 1;
  const downPaymentRatio = values.purchasePrice > 0 ? values.downPayment / values.purchasePrice : 0;
  const riskScore = clamp(clamp(60 - cashFlow / 25) * 0.5 + clamp(leverageRatio * 100) * 0.3 + clamp((0.25 - downPaymentRatio) * 280) * 0.2);

  const cashOnCashScore = clamp((cashOnCashReturn / 20) * 100);
  const marketScore = clamp(clamp((capRate / 10) * 100) * 0.6 + cashOnCashScore * 0.4);
  const overallScore = clamp(marketScore * 0.4 + cashOnCashScore * 0.4 + (100 - riskScore) * 0.2);

  let recommendation: DealScore["recommendation"] = "WATCH";
  if (cashFlow < 0 || overallScore < 50) recommendation = "PASS";
  else if (overallScore >= 75 && riskScore < 50) recommendation = "BUY";

  return { cashFlow, capRate, cashOnCashReturn, riskScore, marketScore, overallScore, recommendation };
};

const SectionHeader = ({ badge, title, description }: { badge: string; title: string; description: string }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
      {badge}
    </Badge>
    <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export const DealAnalyzerSection = () => {
  const [values, setValues] = useState({
    purchasePrice: "350000",
    monthlyRent: "2600",
    monthlyExpenses: "1300",
    downPayment: "70000",
  });
  const [showResults, setShowResults] = useState(false);

  const metrics = useMemo(() => {
    const purchasePrice = Number(values.purchasePrice) || 0;
    const monthlyRent = Number(values.monthlyRent) || 0;
    const monthlyExpenses = Number(values.monthlyExpenses) || 0;
    const downPayment = Number(values.downPayment) || 0;

    return calculateDealScore({ purchasePrice, monthlyRent, monthlyExpenses, downPayment });
  }, [values]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowResults(true);
  };

  const onInputChange = (field: keyof typeof values, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const recommendationStyle =
    metrics.recommendation === "BUY"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : metrics.recommendation === "WATCH"
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-rose-500/40 bg-rose-500/5";

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="Deal Analyzer"
        title="Underwrite Deals in Seconds"
        description="Plug in core property numbers and instantly see whether the deal cash flows, what the cap rate looks like, and your projected ROI."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-primary/20 bg-card/60 shadow-md backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Property Inputs</CardTitle>
            <CardDescription>Adjust assumptions and run the numbers instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              {[
                { label: "Purchase Price", key: "purchasePrice" },
                { label: "Monthly Rent", key: "monthlyRent" },
                { label: "Monthly Expenses", key: "monthlyExpenses" },
                { label: "Down Payment", key: "downPayment" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                  </label>
                  <Input
                    id={field.key}
                    type="number"
                    min="0"
                    value={values[field.key as keyof typeof values]}
                    onChange={(event) => onInputChange(field.key as keyof typeof values, event.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}

              <Button type="submit" className="w-full" size="lg">
                Analyze Deal
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-colors duration-300 ${recommendationStyle}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {metrics.recommendation === "BUY" ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : metrics.recommendation === "WATCH" ? (
                <TrendingUp className="h-5 w-5 text-amber-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-rose-500" />
              )}
              Deal Scorecard
            </CardTitle>
            <CardDescription>Click Analyze Deal to refresh your recommendation.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {showResults ? (
                <motion.div
                  key={`${metrics.cashFlow}-${metrics.capRate}-${metrics.overallScore}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Score</p>
                    <p className="text-4xl font-bold text-primary">{metrics.overallScore.toFixed(1)}</p>
                    <Badge
                      className={`mt-2 ${
                        metrics.recommendation === "BUY"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : metrics.recommendation === "WATCH"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-rose-500/15 text-rose-600"
                      }`}
                      variant="secondary"
                    >
                      {metrics.recommendation}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetricPill
                      label="Monthly Cash Flow"
                      value={currencyFormatter.format(metrics.cashFlow)}
                      positive={metrics.cashFlow >= 0}
                    />
                    <MetricPill
                      label="Cap Rate"
                      value={`${percentFormatter.format(metrics.capRate)}%`}
                      positive={metrics.capRate >= 6}
                    />
                    <MetricPill
                      label="Cash-on-Cash Return"
                      value={`${percentFormatter.format(metrics.cashOnCashReturn)}%`}
                      positive={metrics.cashOnCashReturn >= 8}
                    />
                    <MetricPill label="Risk Score" value={metrics.riskScore.toFixed(1)} positive={metrics.riskScore < 50} />
                    <MetricPill label="Market Score" value={metrics.marketScore.toFixed(1)} positive={metrics.marketScore >= 60} />
                  </div>

                  <div
                    className={`rounded-xl border p-4 text-sm ${
                      metrics.recommendation === "BUY"
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : metrics.recommendation === "WATCH"
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-rose-500/30 bg-rose-500/10"
                    }`}
                  >
                    <p className="mb-1 font-semibold">Recommendation: {metrics.recommendation}</p>
                    <p className="text-muted-foreground">
                      {metrics.recommendation === "BUY"
                        ? "Strong fundamentals and manageable risk profile based on this underwriting snapshot."
                        : metrics.recommendation === "WATCH"
                          ? "The deal is close. Rework pricing, leverage, or operating assumptions before committing."
                          : "Current assumptions indicate weak economics or elevated risk. Consider passing or renegotiating."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
                >
                  Enter numbers on the left and click Analyze Deal to see your projected returns.
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const MetricPill = ({ label, value, positive }: { label: string; value: string; positive: boolean }) => (
  <div className={`rounded-xl border p-3 ${positive ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-semibold">{value}</p>
  </div>
);

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Find a Property",
      description: "Source listings from your market and gather key deal assumptions in one place.",
    },
    {
      icon: Bot,
      title: "Analyze with AI",
      description: "Instantly evaluate cash flow, cap rate, and ROI so you focus on winning opportunities.",
    },
    {
      icon: CheckCircle2,
      title: "Generate Listings & Close Faster",
      description: "Create polished listing copy and follow-up content that turns leads into deals.",
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
  const { getToken } = useAuth();
  const [details, setDetails] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateListing = () => {
    if (!details.trim()) return;
    setIsGenerating(true);
    setOutput("");
    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setOutput("Sign in to run a live AI generation from the demo.");
          return;
        }
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: "listing",
            address: "Property details provided by user",
            beds: "",
            baths: "",
            sqft: "",
            features: details,
            vibe: "",
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to generate listing");
        }
        const text = await response.text();
        setOutput(text);
      } catch {
        setOutput("Generation temporarily unavailable. Please try again in a moment.");
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  return (
    <section className="container mx-auto px-6 py-24">
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
            <Button onClick={generateListing} size="lg" className="w-full sm:w-auto">
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
                  key={output || "empty"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[220px] rounded-xl border bg-background/70 p-4 leading-relaxed"
                >
                  {output || "Click Generate Listing to preview your AI-crafted description."}
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
  const tiers = [
    {
      name: "Free",
      monthlyPrice: 0,
      features: ["Basic analyzer", "Limited listings"],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Pro",
      monthlyPrice: 29,
      features: ["Unlimited deals", "Advanced AI tools"],
      cta: "Upgrade",
      highlighted: true,
    },
    {
      name: "Team",
      monthlyPrice: 79,
      features: ["CRM features", "Multi-user support"],
      cta: "Upgrade",
      highlighted: false,
    },
  ];

  return (
    <section className="container mx-auto px-6 py-24">
      <SectionHeader
        badge="Pricing"
        title="Simple Plans for Every Stage"
        description="Start free, scale as you grow, and give your team the tools to close faster."
      />

      <div className="mb-8 flex items-center justify-center gap-3 text-sm">
        <span className={!annualBilling ? "font-semibold text-foreground" : "text-muted-foreground"}>Monthly</span>
        <Switch checked={annualBilling} onCheckedChange={setAnnualBilling} aria-label="Toggle annual billing" />
        <span className={annualBilling ? "font-semibold text-foreground" : "text-muted-foreground"}>
          Annual
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Save 20%</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative h-full ${
              tier.highlighted
                ? "border-primary bg-primary/5 shadow-[0_0_40px_hsl(42_80%_55%/0.18)]"
                : "border-border bg-card/70"
            }`}
          >
            <CardHeader>
              {tier.highlighted && (
                <Badge className="mb-3 w-fit" variant="default">
                  Most Popular
                </Badge>
              )}
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {currencyFormatter.format(annualBilling ? tier.monthlyPrice * 12 * 0.8 : tier.monthlyPrice)}
                </span>
                <span className="text-muted-foreground">{annualBilling ? "/yr" : "/mo"}</span>
              </div>
            </CardHeader>
            <CardContent className="flex h-full flex-col justify-between">
              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant={tier.highlighted ? "default" : "outline"} className="w-full">
                {tier.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
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

export const FinalCTASection = () => (
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
          <Button size="lg">
            Start Free <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            View Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  </section>
);

export const StickyMobileCTA = () => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur-sm md:hidden">
    <Button className="w-full" size="lg">
      Start Free <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
);
