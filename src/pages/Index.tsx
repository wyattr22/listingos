import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DealAnalyzerSection,
  FAQSection,
  FinalCTASection,
  HowItWorksSection,
  ListingGeneratorDemoSection,
  PricingSection,
  SocialProofSection,
  StickyMobileCTA,
} from "@/components/landing/sections";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(42_80%_55%/0.08),transparent_60%)]" />
        <div className="container mx-auto px-6 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Real Estate Tools
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your Listings.{" "}
              <span className="text-primary">Elevated.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Generate polished MLS descriptions and personalized follow-up emails in seconds. Built for modern real estate agents who close.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/dashboard/listing")}
              className="text-base px-8 py-6 rounded-xl shadow-[0_0_30px_hsl(42_80%_55%/0.2)] hover:shadow-[0_0_40px_hsl(42_80%_55%/0.3)] transition-shadow"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <DealAnalyzerSection />
      <HowItWorksSection />
      <ListingGeneratorDemoSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
