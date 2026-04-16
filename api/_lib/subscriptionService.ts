import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function updatePlan(input: {
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: Date | null;
}) {
  const plan = planFromPriceId(input.stripePriceId);

  await prisma.user.updateMany({
    where: { stripeCustomerId: input.stripeCustomerId },
    data: {
      stripeSubscriptionId: input.stripeSubscriptionId || null,
      stripePriceId: input.stripePriceId || null,
      subscriptionPlan: plan,
      subscriptionCurrentPeriodEnd: input.currentPeriodEnd || null,
    },
  });
}

export function checkPlanAccess(plan: SubscriptionPlan, minimum: SubscriptionPlan): boolean {
  const weight: Record<SubscriptionPlan, number> = { FREE: 0, PRO: 1, TEAM: 2 };
  return weight[plan] >= weight[minimum];
}

export async function downgradeExpiredUsers() {
  await prisma.user.updateMany({
    where: {
      subscriptionPlan: { in: ["PRO", "TEAM"] },
      subscriptionCurrentPeriodEnd: { lt: new Date() },
    },
    data: {
      subscriptionPlan: "FREE",
      stripePriceId: null,
      stripeSubscriptionId: null,
    },
  });
}

export function planFromPriceId(priceId?: string | null): SubscriptionPlan {
  if (!priceId) return "FREE";
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "TEAM";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return "FREE";
}
