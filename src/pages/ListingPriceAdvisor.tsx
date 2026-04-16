import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

const ListingPriceAdvisor = () => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    beds: "",
    baths: "",
    sqft: "",
    condition: "Good",
    neighborhood: "",
    features: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const analyze = async () => {
    if (!form.neighborhood.trim() && !form.features.trim()) {
      toast({ title: "Please enter neighborhood or key features", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const token = await getToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: "listingprice", ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to get price recommendation");
      }
      setResult(await res.text());
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to analyze", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Listing Price Advisor</h1>
        </div>
        <p className="text-muted-foreground">Enter property details to get an AI-powered suggested price range and positioning rationale.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Beds</Label>
              <Input type="number" min="0" placeholder="3" value={form.beds} onChange={(e) => update("beds", e.target.value)} />
            </div>
            <div>
              <Label>Baths</Label>
              <Input type="number" min="0" placeholder="2" value={form.baths} onChange={(e) => update("baths", e.target.value)} />
            </div>
            <div>
              <Label>Sq Ft</Label>
              <Input type="number" min="0" placeholder="1800" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Condition</Label>
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
          <div>
            <Label>Neighborhood / Location</Label>
            <Input placeholder="Downtown Austin, near top-rated schools, walkable..." value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
          </div>
          <div>
            <Label>Key Features & Upgrades</Label>
            <Textarea placeholder="Updated kitchen, new roof, pool, corner lot, solar panels..." value={form.features} onChange={(e) => update("features", e.target.value)} rows={3} />
          </div>
          <Button onClick={analyze} disabled={loading} className="w-full py-6">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Get Price Recommendation"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-primary">Price Recommendation</h3>
                <Button variant="ghost" size="sm" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{result}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ListingPriceAdvisor;
