import { z } from "zod";

export const dealInputSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  purchasePrice: z.coerce.number().finite().positive().max(100_000_000),
  monthlyRent: z.coerce.number().finite().nonnegative().max(1_000_000),
  monthlyExpenses: z.coerce.number().finite().nonnegative().max(1_000_000),
  downPayment: z.coerce.number().finite().nonnegative().max(100_000_000),
});

export const analyzeInputSchema = z.object({
  dealId: z.string().trim().min(1),
});

export const listingGeneratorInputSchema = z.object({
  dealId: z.string().trim().min(1).optional(),
  propertyDetails: z
    .object({
      address: z.string().trim().min(3).max(200),
      beds: z.union([z.string().trim().max(20), z.number().finite().nonnegative().max(20)]).optional(),
      baths: z.union([z.string().trim().max(20), z.number().finite().nonnegative().max(20)]).optional(),
      sqft: z.union([z.string().trim().max(20), z.number().finite().nonnegative().max(50000)]).optional(),
      features: z.string().trim().max(2000).optional(),
      vibe: z.string().trim().max(500).optional(),
      buyerTarget: z.string().trim().max(300).optional(),
      additionalNotes: z.string().trim().max(1500).optional(),
    })
    .strict(),
});

export const analysisResultSchema = z.object({
  mortgageEstimate: z.number().finite().nonnegative(),
  monthlyCashFlow: z.number().finite(),
  capRate: z.number().finite(),
  cashOnCashReturn: z.number().finite(),
  riskScore: z.number().finite().min(0).max(100),
  marketScore: z.number().finite().min(0).max(100),
  overallScore: z.number().finite().min(0).max(100),
  recommendation: z.enum(["BUY", "WATCH", "PASS"]),
});

export const listingOutputSchema = z.object({
  headline: z.string().trim().min(1).max(140),
  summary: z.string().trim().min(1).max(2500),
  bullets: z.array(z.string().trim().min(1).max(220)).min(3).max(5),
});
