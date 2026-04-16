import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import ListingGenerator from "./pages/ListingGenerator";
import FollowUpGenerator from "./pages/FollowUpGenerator";
import DashboardOverview from "./pages/DashboardOverview";
import OfferStrengthEstimator from "./pages/OfferStrengthEstimator";
import ListingPriceAdvisor from "./pages/ListingPriceAdvisor";

const queryClient = new QueryClient();

const ProtectedDashboard = () => (
  <>
    <SignedIn>
      <DashboardLayout />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<ProtectedDashboard />}>
            <Route index element={<DashboardOverview />} />
            <Route path="listing" element={<ListingGenerator />} />
            <Route path="follow-up" element={<FollowUpGenerator />} />
            <Route path="offer-strength" element={<OfferStrengthEstimator />} />
            <Route path="listing-price" element={<ListingPriceAdvisor />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
