import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Copy, Check, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGenerateDrip } from "@/hooks/use-saas-api";
import { ProGate } from "@/components/ProGate";
import type { DripOutput, DripEmail } from "../../lib/gemini-generate-server";

const EmailCard = ({ email, index }: { email: DripEmail; index: number }) => {
  const [open, setOpen] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      <button type="button" className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-sm">{email.label}</p>
                <p className="text-xs text-muted-foreground">{email.timing}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </CardHeader>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 px-5 pb-5 space-y-3">
              <div className="rounded-lg bg-muted/40 border px-4 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
                <p className="text-sm font-medium">{email.subject}</p>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 rounded-lg border bg-background/60 px-4 py-3">
                {email.body}
              </div>
              <Button variant="outline" size="sm" onClick={copy} className="w-full">
                {copied ? <><Check className="h-4 w-4 mr-2" />Copied!</> : <><Copy className="h-4 w-4 mr-2" />Copy Email</>}
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const EmailDrip = () => {
  const { toast } = useToast();
  const generateDrip = useGenerateDrip();
  const [result, setResult] = useState<DripOutput | null>(null);

  const [form, setForm] = useState({ clientName: "", propertyAddress: "", showingNotes: "", buyerGoals: "" });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.clientName || !form.propertyAddress) {
      toast({ title: "Enter client name and property address", variant: "destructive" });
      return;
    }
    try {
      const data = await generateDrip.mutateAsync(form);
      setResult(data.output);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to generate sequence", variant: "destructive" });
    }
  };

  return (
    <ProGate>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Email Drip Sequence</h1>
          </div>
          <p className="text-muted-foreground">Generate a complete 4-email follow-up sequence after a showing. Each email is tailored for the right moment.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                <Input placeholder="Sarah Johnson" value={form.clientName} onChange={e => update("clientName", e.target.value)} />
              </div>
              <div>
                <Label>Property Address</Label>
                <Input placeholder="123 Maple St, Austin, TX" value={form.propertyAddress} onChange={e => update("propertyAddress", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes from Showing</Label>
              <Textarea placeholder="Loved the backyard and kitchen, concerned about the master bath size, asked about school district..." rows={3} value={form.showingNotes} onChange={e => update("showingNotes", e.target.value)} />
            </div>
            <div>
              <Label>Buyer Goals (optional)</Label>
              <Input placeholder="First home, needs to close by summer, wants good schools..." value={form.buyerGoals} onChange={e => update("buyerGoals", e.target.value)} />
            </div>
            <Button onClick={generate} disabled={generateDrip.isPending} className="w-full py-6">
              {generateDrip.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Sequence...</> : "Generate 4-Email Sequence"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-primary">Your Follow-Up Sequence</h2>
              <p className="text-xs text-muted-foreground">Click each email to expand and copy</p>
            </div>
            {result.emails.map((email, i) => (
              <EmailCard key={i} email={email} index={i} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </ProGate>
  );
};

export default EmailDrip;
