import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertListingGenerationAllowed } from "./_lib/limits.js";
import { logApiEvent } from "./_lib/logging.js";
import { requireAuth } from "./_lib/security.js";
import { generateWithGemini } from "../lib/gemini-generate-server.js";
import { z } from "zod";

const generateInputSchema = z.object({
  type: z.enum(["listing", "followup", "listingprice"]),
  address: z.string().optional(),
  beds: z.string().optional(),
  baths: z.string().optional(),
  sqft: z.string().optional(),
  features: z.string().optional(),
  vibe: z.string().optional(),
  guestName: z.string().optional(),
  propertyAddress: z.string().optional(),
  notes: z.string().optional(),
  condition: z.string().optional(),
  neighborhood: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    res.status(500).json({ error: "Missing GROQ_API_KEY" });
    return;
  }
  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await assertListingGenerationAllowed(auth.userId, auth.plan);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = generateInputSchema.parse(body);
    const result = await generateWithGemini(apiKey, input);
    if (!result.ok) {
      const err = result as { ok: false; status: number; error: string };
      res.status(err.status).json({ error: err.error });
      return;
    }
    await logApiEvent({ userId, endpoint: "/api/generate", method: "POST", statusCode: 200, success: true, metadata: { type: input.type } });
    res.status(200).setHeader("Content-Type", "text/plain").send(result.text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 502;
    await logApiEvent({ userId, endpoint: "/api/generate", method: req.method || "UNKNOWN", statusCode: status, success: false, message });
    res.status(status).json({ error: message });
  }
}
