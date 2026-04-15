import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, json } from "./_lib/http";
import { logApiEvent } from "./_lib/logging";
import { prisma } from "./_lib/prisma";
import { requireAuth } from "./_lib/security";
import { dealInputSchema } from "./_lib/validation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const input = dealInputSchema.parse(body);

      const deal = await prisma.deal.create({
        data: {
          userId: auth.userId,
          name: input.name,
          purchasePrice: input.purchasePrice,
          monthlyRent: input.monthlyRent,
          monthlyExpenses: input.monthlyExpenses,
          downPayment: input.downPayment,
        },
      });

      await logApiEvent({ userId, endpoint: "/api/deals", method: "POST", statusCode: 201, success: true });
      return json(res, 201, { deal });
    }

    if (req.method === "GET") {
      const deals = await prisma.deal.findMany({
        where: { userId: auth.userId },
        include: {
          analysisResults: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          listings: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      await logApiEvent({ userId, endpoint: "/api/deals", method: "GET", statusCode: 200, success: true });
      return json(res, 200, { deals });
    }

    return methodNotAllowed(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      userId,
      endpoint: "/api/deals",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
