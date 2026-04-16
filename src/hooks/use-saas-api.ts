import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";

const jsonHeaders = { "Content-Type": "application/json" };

async function getAuthHeaders(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) {
    throw new Error("Unauthorized");
  }
  return { Authorization: `Bearer ${token}` };
}

export type DealInput = {
  name?: string;
  purchasePrice: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPayment: number;
};

export const useDeals = () => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ["deals"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const response = await fetch("/api/deals", { headers: await getAuthHeaders(getToken) });
      if (!response.ok) throw new Error("Failed to fetch deals");
      return response.json();
    },
  });
};

export const useCreateDeal = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: DealInput) => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to save deal");
      return response.json();
    },
  });
};

export const useAnalyzeDeal = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify({ dealId }),
      });
      if (!response.ok) throw new Error("Failed to analyze deal");
      return response.json();
    },
  });
};

export const useGenerateListing = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      dealId?: string;
      propertyDetails: Record<string, string | number | undefined>;
    }) => {
      const response = await fetch("/api/listing-generator", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to generate listing");
      return response.json();
    },
  });
};

export const useDashboardData = () => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ["dashboard"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { headers: await getAuthHeaders(getToken) });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
  });
};

export const useUserPlan = () => {
  const { data, isLoading } = useDashboardData();
  const plan = (data?.usage?.plan ?? "FREE") as "FREE" | "PRO" | "TEAM";
  return { plan, isPro: plan === "PRO" || plan === "TEAM", isFree: plan === "FREE", isLoading };
};

export const useGenerateCMA = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await fetch("/api/cma", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to generate CMA");
      }
      return response.json();
    },
  });
};

export const useGenerateDrip = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await fetch("/api/drip", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to generate drip sequence");
      }
      return response.json();
    },
  });
};

export const useGenerateSocial = () => {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { ...jsonHeaders, ...(await getAuthHeaders(getToken)) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to generate social content");
      }
      return response.json();
    },
  });
};

export const useHistory = () => {
  const { isSignedIn, getToken } = useAuth();
  return useQuery({
    queryKey: ["history"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { headers: await getAuthHeaders(getToken) });
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      return (data.listings ?? []) as Array<{ id: string; content: string; meta: Record<string, unknown>; createdAt: string }>;
    },
  });
};
