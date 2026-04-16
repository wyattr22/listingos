import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma.js";

const planLimits = {
  FREE: { maxAnalysesPerDay: 10, maxListingsPerDay: 10 },
  PRO: { maxAnalysesPerDay: 100, maxListingsPerDay: 100 },
  TEAM: { maxAnalysesPerDay: 500, maxListingsPerDay: 500 },
} as const;

const startOfDay = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export async function checkUsageLimits(userId: string, plan: SubscriptionPlan) {
  const since = startOfDay();
  const [analysesUsed, listingsUsed] = await Promise.all([
    prisma.analysisResult.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    }),
    prisma.listing.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    }),
  ]);

  return {
    plan,
    analysesUsed,
    listingsUsed,
    analysesRemaining: Math.max(0, planLimits[plan].maxAnalysesPerDay - analysesUsed),
    listingsRemaining: Math.max(0, planLimits[plan].maxListingsPerDay - listingsUsed),
    limits: planLimits[plan],
  };
}

export async function assertAnalysisAllowed(userId: string, plan: SubscriptionPlan) {
  const usage = await checkUsageLimits(userId, plan);
  if (usage.analysesUsed >= usage.limits.maxAnalysesPerDay) {
    throw new Error(`Analysis daily limit reached for ${plan} plan`);
  }
}

export async function assertListingGenerationAllowed(userId: string, plan: SubscriptionPlan) {
  const usage = await checkUsageLimits(userId, plan);
  if (usage.listingsUsed >= usage.limits.maxListingsPerDay) {
    throw new Error(`Listing generation daily limit reached for ${plan} plan`);
  }
}

export async function requireProAccess(plan: SubscriptionPlan) {
  if (plan === "FREE") {
    throw new Error("Pro plan required");
  }
}

export async function legacyAssertAnalysisAllowed(userId: string, plan: keyof typeof planLimits) {
  const used = await prisma.analysisResult.count({
    where: {
      userId,
      createdAt: { gte: startOfDay() },
    },
  });

  const limit = planLimits[plan].maxAnalysesPerDay;
  if (used >= limit) {
    throw new Error(`Analysis limit reached for ${plan} plan`);
  }
}

export async function legacyAssertListingGenerationAllowed(userId: string, plan: keyof typeof planLimits) {
  const used = await prisma.listing.count({
    where: {
      userId,
      createdAt: { gte: startOfDay() },
    },
  });

  const limit = planLimits[plan].maxListingsPerDay;
  if (used >= limit) {
    throw new Error(`Listing generation limit reached for ${plan} plan`);
  }
}
