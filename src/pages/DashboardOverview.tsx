import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/use-saas-api";

const MetricCard = ({ title, value }: { title: string; value: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold">{value}</p>
    </CardContent>
  </Card>
);

const DashboardOverview = () => {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Unable to load dashboard data. Please sign in again to refresh your authenticated session.
      </div>
    );
  }

  const metrics = data?.metrics;
  const deals = data?.deals ?? [];
  const listings = data?.listings ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Track your deal analyses and listing generation activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Deals Analyzed" value={String(metrics?.totalDealsAnalyzed ?? 0)} />
        <MetricCard title="Avg Cash-on-Cash Return" value={`${Number(metrics?.averageRoi ?? 0).toFixed(1)}%`} />
        <MetricCard
          title="Best Deal Score"
          value={metrics?.bestPerformingDeal ? `${Number(metrics.bestPerformingDeal.overallScore).toFixed(1)}` : "--"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Deals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals saved yet.</p>
          ) : (
            deals.slice(0, 10).map((deal: any) => (
              <div key={deal.id} className="rounded-lg border p-3">
                <p className="font-medium">{deal.name || "Untitled deal"}</p>
                <p className="text-sm text-muted-foreground">
                  Purchase: ${Number(deal.purchasePrice).toLocaleString()} | Rent: ${Number(deal.monthlyRent).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Listings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings generated yet.</p>
          ) : (
            listings.slice(0, 5).map((listing: any) => (
              <div key={listing.id} className="rounded-lg border p-3">
                <p className="text-sm whitespace-pre-wrap">{String(listing.content).slice(0, 220)}...</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
