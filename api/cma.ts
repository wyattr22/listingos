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
  notes: z.string().trim().max(500).default(""),
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
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await requireProAccess(auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = cmaInputSchema.parse(body) as CMAInput;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return json(res, 500, { error: "Service unavailable" });

    const output = await generateCMA(apiKey, input);

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
        sourceInput: input as unknown as Record<string, unknown>,
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
