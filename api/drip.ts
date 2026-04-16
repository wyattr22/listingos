import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "./_lib/http.js";
import { logApiEvent } from "./_lib/logging.js";
import { prisma } from "./_lib/prisma.js";
import { requireAuth } from "./_lib/security.js";
import { requireProAccess } from "./_lib/limits.js";
import { generateDrip, type DripInput } from "../lib/gemini-generate-server.js";
import { z } from "zod";

const dripInputSchema = z.object({
  clientName: z.string().trim().min(1).max(100),
  propertyAddress: z.string().trim().min(3).max(200),
  showingNotes: z.string().trim().max(2000).default(""),
  buyerGoals: z.string().trim().max(500).default(""),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await requireProAccess(auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = dripInputSchema.parse(body) as DripInput;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return json(res, 500, { error: "Service unavailable" });

    const output = await generateDrip(apiKey, input);

    const listing = await prisma.listing.create({
      data: {
        userId,
        sourceInput: input as unknown as Record<string, unknown>,
        content: output.emails[0]?.body ?? "",
        meta: { type: "drip", clientName: input.clientName, propertyAddress: input.propertyAddress, ...output },
      },
    });

    await logApiEvent({ userId, endpoint: "/api/drip", method: "POST", statusCode: 200, success: true });
    return json(res, 200, { id: listing.id, output, createdAt: listing.createdAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Pro plan required" ? 403 : 400;
    await logApiEvent({ userId, endpoint: "/api/drip", method: req.method || "POST", statusCode: status, success: false, message });
    return json(res, status, { error: message });
  }
}
