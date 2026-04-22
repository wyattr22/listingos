import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "./_lib/http.js";
import { logApiEvent } from "./_lib/logging.js";
import { prisma } from "./_lib/prisma.js";
import { requireAuth } from "./_lib/security.js";
import { requireProAccess } from "./_lib/limits.js";
import { generateCMA, type CMAInput } from "../lib/gemini-generate-server.js";
import { z } from "zod";

const compSchema = z.object({
  address: z.string().trim().min(3).max(200),
  beds: z.string().trim().max(10).default(""),
  baths: z.string().trim().max(10).default(""),
  sqft: z.string().trim().max(20).default(""),
  salePrice: z.string().trim().min(1).max(30),
  saleDate: z.string().trim().min(1).max(30),
  notes: z.string().trim().max(2000).default(""),
});

const cmaInputSchema = z.object({
  property: z.object({
    address: z.string().trim().min(3).max(200),
    beds: z.string().trim().max(10).default(""),
    baths: z.string().trim().max(10).default(""),
    sqft: z.string().trim().max(20).default(""),
    condition: z.string().trim().max(50).default("Good"),
    features: z.string().trim().max(1000).default(""),
    agentName: z.string().trim().max(100).default(""),
    brokerage: z.string().trim().max(100).default(""),
  }),
  comps: z.array(compSchema).min(2).max(6),
  marketContext: z.object({
    medianSalePrice: z.number().nullable().optional(),
    medianListPrice: z.number().nullable().optional(),
    medianPpsf: z.number().nullable().optional(),
    medianDom: z.number().nullable().optional(),
    avgSaleToList: z.number().nullable().optional(),
    soldAboveList: z.number().nullable().optional(),
    inventory: z.number().nullable().optional(),
    homesSold: z.number().nullable().optional(),
    metroRegion: z.string().nullable().optional(),
    periodBegin: z.string().optional(),
  }).nullable().optional(),
  censusContext: z.object({
    medianHouseholdIncome: z.number().nullable().optional(),
    medianHomeValue: z.number().nullable().optional(),
    medianGrossRent: z.number().nullable().optional(),
    population: z.number().nullable().optional(),
  }).nullable().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await requireProAccess(auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { marketContext, censusContext, ...rest } = cmaInputSchema.parse(body);
    const input = rest as CMAInput;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return json(res, 500, { error: "Service unavailable" });

    const marketSupplement = marketContext ? [
      "",
      "--- ZIP CODE MARKET DATA (Redfin) ---",
      marketContext.medianSalePrice ? `Median Sale Price: $${marketContext.medianSalePrice.toLocaleString()}` : "",
      marketContext.medianPpsf ? `Median Price/Sq Ft: $${Math.round(marketContext.medianPpsf)}` : "",
      marketContext.medianDom != null ? `Median Days on Market: ${marketContext.medianDom}` : "",
      marketContext.avgSaleToList != null ? `Avg Sale-to-List: ${(marketContext.avgSaleToList * 100).toFixed(1)}%` : "",
      marketContext.inventory != null ? `Active Inventory: ${marketContext.inventory}` : "",
      marketContext.metroRegion ? `Metro: ${marketContext.metroRegion}` : "",
      censusContext?.medianHouseholdIncome ? `Median Household Income: $${censusContext.medianHouseholdIncome.toLocaleString()}` : "",
      "--------------------------------------",
    ].filter(Boolean).join("\n") : "";

    const output = await generateCMA(apiKey, input, marketSupplement);

    const formattedContent = [
      `CMA: ${input.property.address}`,
      "",
      output.executiveSummary,
      "",
      `Recommended Price: $${output.recommendedPrice.toLocaleString()}`,
      `Range: $${output.recommendedPriceLow.toLocaleString()} – $${output.recommendedPriceHigh.toLocaleString()}`,
    ].join("\n");

    const listing = await prisma.listing.create({
      data: {
        userId,
        sourceInput: input as object,
        content: formattedContent,
        meta: { type: "cma", ...output },
      },
    });

    await logApiEvent({ userId, endpoint: "/api/cma", method: "POST", statusCode: 200, success: true });
    return json(res, 200, { id: listing.id, output, createdAt: listing.createdAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Pro plan required" ? 403 : 400;
    await logApiEvent({ userId, endpoint: "/api/cma", method: req.method || "POST", statusCode: status, success: false, message });
    return json(res, status, { error: message });
  }
}
