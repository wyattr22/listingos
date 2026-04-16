import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Loader2, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGenerateSocial } from "@/hooks/use-saas-api";
import { ProGate } from "@/components/ProGate";
import type { SocialOutput } from "../../lib/gemini-generate-server";

const CopyCard = ({ title, icon, content, subContent }: { title: string; icon: React.ReactNode; content: string; subContent?: string }) => {
  const [copied, setCopied] = useState(false);
  const full = subContent ? `${content}\n\n${subContent}` : content;
  const copy = () => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <Card className="border-border bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{content}</p>
        {subContent && (
          <p className="text-xs text-primary leading-relaxed">{subContent}</p>
        )}
        <Button variant="outline" size="sm" onClick={copy} className="w-full">
          {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
        </Button>
      </CardContent>
    </Card>
  );
};

const EmailCard = ({ subject, body }: { subject: string; body: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Card className="border-border bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">Email Blast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted/40 border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
          <p className="text-sm font-medium">{subject}</p>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{body}</p>
        <Button variant="outline" size="sm" onClick={copy} className="w-full">
          {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy Full Email</>}
        </Button>
      </CardContent>
    </Card>
  );
};

const SocialContentPack = () => {
  const { toast } = useToast();
  const generateSocial = useGenerateSocial();
  const [result, setResult] = useState<SocialOutput | null>(null);

  const [form, setForm] = useState({ address: "", beds: "", baths: "", sqft: "", price: "", features: "", openHouseDate: "", agentName: "" });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.address) { toast({ title: "Enter the property address", variant: "destructive" }); return; }
    try {
      const data = await generateSocial.mutateAsync(form);
      setResult(data.output);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to generate content", variant: "destructive" });
    }
  };

  return (
    <ProGate>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Social Content Pack</h1>
          </div>
          <p className="text-muted-foreground">One listing, four platforms. Generate Instagram, Facebook, open house, and email blast content in one click.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <Label>Property Address</Label>
              <Input placeholder="123 Maple St, Austin, TX 78701" value={form.address} onChange={e => update("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label>Beds</Label><Input placeholder="3" value={form.beds} onChange={e => update("beds", e.target.value)} /></div>
              <div><Label>Baths</Label><Input placeholder="2" value={form.baths} onChange={e => update("baths", e.target.value)} /></div>
              <div><Label>Sq Ft</Label><Input placeholder="1800" value={form.sqft} onChange={e => update("sqft", e.target.value)} /></div>
              <div><Label>List Price</Label><Input placeholder="$525,000" value={form.price} onChange={e => update("price", e.target.value)} /></div>
            </div>
            <div>
              <Label>Key Features</Label>
              <Textarea placeholder="Updated kitchen, pool, great schools, walkable neighborhood..." rows={2} value={form.features} onChange={e => update("features", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Open House Date (optional)</Label><Input placeholder="Sat Jan 18, 1-4pm" value={form.openHouseDate} onChange={e => update("openHouseDate", e.target.value)} /></div>
              <div><Label>Agent Name (optional)</Label><Input placeholder="Your name" value={form.agentName} onChange={e => update("agentName", e.target.value)} /></div>
            </div>
            <Button onClick={generate} disabled={generateSocial.isPending} className="w-full py-6">
              {generateSocial.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Content Pack...</> : "Generate Social Content Pack"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-semibold text-primary">Your Content Pack</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <CopyCard
                title="Instagram"
                icon={<Instagram className="h-3.5 w-3.5" />}
                content={result.instagram.caption}
                subContent={result.instagram.hashtags}
              />
              <CopyCard
                title="Facebook"
                icon={<Facebook className="h-3.5 w-3.5" />}
                content={result.facebook.post}
              />
            </div>
            <CopyCard
              title="Open House Announcement"
              icon={<Share2 className="h-3.5 w-3.5" />}
              content={result.openHouse.announcement}
            />
            <EmailCard subject={result.emailBlast.subject} body={result.emailBlast.body} />
          </motion.div>
        )}
      </motion.div>
    </ProGate>
  );
};

export default SocialContentPack;
