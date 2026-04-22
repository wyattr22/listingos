import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "./_lib/http.js";
import { logApiEvent } from "./_lib/logging.js";
import { prisma } from "./_lib/prisma.js";
import { requireAuth } from "./_lib/security.js";
import { requireProAccess } from "./_lib/limits.js";
import { generateSocial, type SocialInput } from "../lib/gemini-generate-server.js";
import { z } from "zod";

const socialInputSchema = z.object({
  address: z.string().trim().min(3).max(200),
  beds: z.string().trim().max(10).default(""),
  baths: z.string().trim().max(10).default(""),
  sqft: z.string().trim().max(20).default(""),
  price: z.string().trim().max(30).default(""),
  features: z.string().trim().max(3000).default(""),
  openHouseDate: z.string().trim().max(100).default(""),
  agentName: z.string().trim().max(100).default(""),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await requireProAccess(auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = socialInputSchema.parse(body) as SocialInput;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return json(res, 500, { error: "Service unavailable" });

    const output = await generateSocial(apiKey, input);

    const listing = await prisma.listing.create({
      data: {
        userId,
        sourceInput: input as object,
        content: output.instagram.caption,
        meta: { type: "social", address: input.address, ...output } as object,
      },
    });

    await logApiEvent({ userId, endpoint: "/api/social", method: "POST", statusCode: 200, success: true });
    return json(res, 200, { id: listing.id, output, createdAt: listing.createdAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Pro plan required" ? 403 : 400;
    await logApiEvent({ userId, endpoint: "/api/social", method: req.method || "POST", statusCode: status, success: false, message });
    return json(res, status, { error: message });
  }
}
