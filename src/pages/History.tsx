import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, FileText, Mail, BarChart2, Share2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/use-saas-api";

type HistoryItem = {
  id: string;
  content: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  listing: { label: "Listing", icon: <FileText className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  cma: { label: "CMA", icon: <BarChart2 className="h-4 w-4" />, color: "bg-primary/10 text-primary border-primary/20" },
  drip: { label: "Drip", icon: <Mail className="h-4 w-4" />, color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  social: { label: "Social", icon: <Share2 className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const getType = (item: HistoryItem): string => (item.meta?.type as string) ?? "listing";

const getTitle = (item: HistoryItem): string => {
  const type = getType(item);
  const meta = item.meta as Record<string, unknown>;
  if (type === "cma") return `CMA: ${(meta.address as string) ?? "Property"}`;
  if (type === "drip") return `Drip: ${(meta.clientName as string) ?? "Client"} — ${(meta.propertyAddress as string) ?? "Property"}`;
  if (type === "social") return `Social Pack: ${(meta.address as string) ?? "Property"}`;
  return item.content.slice(0, 60) + (item.content.length > 60 ? "..." : "");
};

const FILTERS = ["all", "listing", "cma", "drip", "social"] as const;
type Filter = typeof FILTERS[number];

const HistoryPage = () => {
  const { data: items = [], isLoading, error } = useHistory();
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === "all" ? items : items.filter(i => getType(i) === filter);

  if (isLoading) return <div className="text-muted-foreground">Loading history...</div>;
  if (error) return <div className="text-destructive text-sm">Unable to load history.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">History</h1>
        </div>
        <p className="text-muted-foreground">All your saved generations across every tool.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors capitalize ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${items.length})` : `${typeConfig[f]?.label} (${items.filter(i => getType(i) === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No {filter === "all" ? "saved generations" : typeConfig[filter]?.label.toLowerCase() + " records"} yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const type = getType(item);
            const config = typeConfig[type] ?? typeConfig.listing;
            const isOpen = expanded === item.id;
            return (
              <Card key={item.id} className="overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className={`shrink-0 gap-1.5 ${config.color}`}>
                          {config.icon} {config.label}
                        </Badge>
                        <p className="text-sm font-medium truncate">{getTitle(item)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </div>
                    </div>
                  </CardContent>
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <CardContent className="pt-0 px-5 pb-5 border-t">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-3 max-h-48 overflow-y-auto">
                        {item.content}
                      </pre>
                    </CardContent>
                  </motion.div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
