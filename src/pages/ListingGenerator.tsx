import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { streamGenerate } from "@/lib/stream-chat";

const ListingGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    address: "",
    beds: "",
    baths: "",
    sqft: "",
    features: "",
    vibe: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const generate = async () => {
    if (!form.address) { toast({ title: "Please enter a property address", variant: "destructive" }); return; }
    setLoading(true);
    setResult("");
    await streamGenerate({
      type: "listing",
      payload: form,
      onDelta: (t) => setResult((p) => p + t),
      onDone: () => setLoading(false),
      onError: (e) => { toast({ title: e, variant: "destructive" }); setLoading(false); },
    });
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
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Listing Description Generator</h1>
        </div>
        <p className="text-muted-foreground">Enter property details to generate a professional MLS listing description.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <Label>Property Address</Label>
            <Input placeholder="123 Main St, City, State" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Beds</Label><Input type="number" placeholder="3" value={form.beds} onChange={(e) => update("beds", e.target.value)} /></div>
            <div><Label>Baths</Label><Input type="number" placeholder="2" value={form.baths} onChange={(e) => update("baths", e.target.value)} /></div>
            <div><Label>Sq Ft</Label><Input type="number" placeholder="1800" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} /></div>
          </div>
          <div>
            <Label>Key Features</Label>
            <Textarea placeholder="Updated kitchen, hardwood floors, pool, large backyard..." value={form.features} onChange={(e) => update("features", e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Neighborhood Vibe</Label>
            <Input placeholder="Family-friendly, walkable, trendy downtown..." value={form.vibe} onChange={(e) => update("vibe", e.target.value)} />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full py-6">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Description"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-primary">Generated Description</h3>
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

export default ListingGenerator;
