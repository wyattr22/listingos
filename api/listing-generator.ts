import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateListingWithGroq } from "./_lib/groq.js";
import { methodNotAllowed, json } from "./_lib/http.js";
import { assertListingGenerationAllowed } from "./_lib/limits.js";
import { logApiEvent } from "./_lib/logging.js";
import { prisma } from "./_lib/prisma.js";
import { requireAuth } from "./_lib/security.js";
import { listingGeneratorInputSchema, listingOutputSchema } from "./_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await assertListingGenerationAllowed(auth.userId, auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = listingGeneratorInputSchema.parse(body);

    const generated = listingOutputSchema.parse(await generateListingWithGroq(input.propertyDetails));
    const formattedContent = [generated.headline, "", generated.summary, "", ...generated.bullets.map((b) => `- ${b}`)]
      .join("\n")
      .trim();

    const listing = await prisma.listing.create({
      data: {
        userId: auth.userId,
        dealId: input.dealId,
        sourceInput: input.propertyDetails,
        content: formattedContent,
        meta: generated,
      },
    });

    await logApiEvent({
      userId,
      endpoint: "/api/listing-generator",
      method: "POST",
      statusCode: 200,
      success: true,
      metadata: { dealId: input.dealId || null },
    });
    return json(res, 200, {
      listing: {
        id: listing.id,
        content: listing.content,
        meta: listing.meta,
        createdAt: listing.createdAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      userId,
      endpoint: "/api/listing-generator",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
