import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "./_lib/http.js";
import { logApiEvent } from "./_lib/logging.js";
import { prisma } from "./_lib/prisma.js";
import { checkUsageLimits, requireAuth } from "./_lib/security.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const [deals, analyses, listings] = await Promise.all([
      prisma.deal.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.analysisResult.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const avgRoi = analyses.length
      ? analyses.reduce((acc, item) => acc + Number(item.cashOnCashReturn), 0) / analyses.length
      : 0;

    const bestDeal = analyses.reduce<null | { dealId: string; overallScore: number; recommendation: string }>((best, current) => {
      const score = Number(current.overallScore);
      if (!best || score > best.overallScore) {
        return { dealId: current.dealId, overallScore: score, recommendation: current.recommendation };
      }
      return best;
    }, null);
    const usage = await checkUsageLimits(auth.userId, auth.plan);

    await logApiEvent({ userId, endpoint: "/api/dashboard", method: "GET", statusCode: 200, success: true });
    return json(res, 200, {
      metrics: {
        totalDealsAnalyzed: analyses.length,
        averageRoi: avgRoi,
        bestPerformingDeal: bestDeal,
      },
      usage,
      deals,
      analyses,
      listings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      userId,
      endpoint: "/api/dashboard",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
