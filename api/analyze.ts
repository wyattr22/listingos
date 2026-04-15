import type { VercelRequest, VercelResponse } from "@vercel/node";
import { scoreDeal } from "./_lib/dealScoring";
import { methodNotAllowed, json } from "./_lib/http";
import { logApiEvent } from "./_lib/logging";
import { assertAnalysisAllowed } from "./_lib/limits";
import { prisma } from "./_lib/prisma";
import { requireAuth } from "./_lib/security";
import { analysisResultSchema, analyzeInputSchema } from "./_lib/validation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    await assertAnalysisAllowed(auth.userId, auth.plan);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = analyzeInputSchema.parse(body);

    const deal = await prisma.deal.findFirst({
      where: {
        id: input.dealId,
        userId: auth.userId,
      },
    });

    if (!deal) {
      return json(res, 404, { error: "Deal not found" });
    }

    const metrics = calculateDealMetrics({
    const scoring = scoreDeal({
      purchasePrice: Number(deal.purchasePrice),
      monthlyRent: Number(deal.monthlyRent),
      monthlyExpenses: Number(deal.monthlyExpenses),
      downPayment: Number(deal.downPayment),
    });
    const validatedMetrics = analysisResultSchema.parse({
      mortgageEstimate: scoring.mortgageEstimate,
      monthlyCashFlow: scoring.cashFlow,
      capRate: scoring.capRate,
      cashOnCashReturn: scoring.cashOnCashReturn,
      riskScore: scoring.riskScore,
      marketScore: scoring.marketScore,
      overallScore: scoring.overallScore,
      recommendation: scoring.recommendation,
    });

    const result = await prisma.analysisResult.create({
      data: {
        userId: auth.userId,
        dealId: deal.id,
        mortgageEstimate: validatedMetrics.mortgageEstimate,
        monthlyCashFlow: validatedMetrics.monthlyCashFlow,
        capRate: validatedMetrics.capRate,
        cashOnCashReturn: validatedMetrics.cashOnCashReturn,
        riskScore: validatedMetrics.riskScore,
        marketScore: validatedMetrics.marketScore,
        overallScore: validatedMetrics.overallScore,
        roi: validatedMetrics.cashOnCashReturn,
        recommendation: validatedMetrics.recommendation,
      },
    });

    await logApiEvent({ userId, endpoint: "/api/analyze", method: "POST", statusCode: 200, success: true });
    return json(res, 200, { result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      userId,
      endpoint: "/api/analyze",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
