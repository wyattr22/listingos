import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserPlan } from "@/hooks/use-saas-api";

export const ProGate = ({ children }: { children: React.ReactNode }) => {
  const { isPro, isLoading } = useUserPlan();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  if (!isPro) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-primary/20 bg-primary/5 text-center">
          <CardContent className="pt-10 pb-10 space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Pro Feature</h2>
              <p className="text-muted-foreground text-sm">
                This tool is available on the Pro and Team plans. Upgrade to unlock the full toolkit built for agents who close.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate("/")}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
