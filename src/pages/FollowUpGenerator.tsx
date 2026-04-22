import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Mail, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { streamGenerate } from "@/lib/stream-chat";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const FollowUpGenerator = () => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    notes: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const generate = async () => {
    if (!form.name || !form.address) { toast({ title: "Please fill in required fields", variant: "destructive" }); return; }
    const token = await getToken();
    if (!token) {
      toast({ title: "Please sign in to generate emails", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    await streamGenerate({
      type: "followup",
      token,
      payload: { guestName: form.name, propertyAddress: form.address, notes: form.notes },
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
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Open House Follow-Up Email</h1>
        </div>
        <p className="text-muted-foreground">Generate a warm, personalized follow-up email from your showing notes.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <Label>Attendee Name</Label>
            <Input placeholder="John Smith" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <Label>Property Address</Label>
            <AddressAutocomplete placeholder="123 Main St, City, State" value={form.address} onChange={v => update("address", v)} />
          </div>
          <div>
            <Label>Notes from Showing</Label>
            <Textarea placeholder="Loved the backyard, concerned about price, interested in the school district..." value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full py-6">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Follow-Up Email"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-primary">Generated Email</h3>
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

export default FollowUpGenerator;
