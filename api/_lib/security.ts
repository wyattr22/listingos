import type { SubscriptionPlan } from "@prisma/client";
import type { VercelRequest } from "@vercel/node";
import { type AuthContext, requireAuth as baseRequireAuth } from "./auth.js";
import { checkUsageLimits as baseCheckUsageLimits } from "./limits.js";
import { checkPlanAccess } from "./subscriptionService.js";

export async function requireAuth(req: VercelRequest): Promise<AuthContext> {
  return baseRequireAuth(req);
}

export async function requireProAccess(plan: SubscriptionPlan) {
  if (!checkPlanAccess(plan, "PRO")) {
    throw new Error("Pro plan required");
  }
}

export async function checkUsageLimits(userId: string, plan: SubscriptionPlan) {
  return baseCheckUsageLimits(userId, plan);
}
