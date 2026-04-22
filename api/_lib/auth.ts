import type { VercelRequest } from "@vercel/node";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "./prisma.js";

export type AuthContext = {
  userId: string;
  email: string;
  plan: "FREE" | "PRO" | "TEAM";
  clerkUserId: string;
};

function parseBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim() || null;
}

export async function requireAuth(req: VercelRequest): Promise<AuthContext> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Server auth misconfigured");
  }

  const token = parseBearerToken(req);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const tokenPayload = await verifyToken(token, { secretKey });
  const clerkUserId = tokenPayload.sub;

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const clerkClient = createClerkClient({ secretKey });
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress;
  const email = (primaryEmail || `${clerkUserId}@clerk.local`).toLowerCase();

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "wyatt.rantz@gmail.com,ajakeryan@gmail.com").toLowerCase().split(",").map((e) => e.trim());
  const isAdmin = ADMIN_EMAILS.includes(email);
  const adminOverride = isAdmin ? { subscriptionPlan: "PRO" as const, subscriptionCurrentPeriodEnd: new Date("2099-01-01") } : {};

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || undefined,
      image: clerkUser.imageUrl || undefined,
      ...adminOverride,
    },
    create: {
      clerkUserId,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || undefined,
      image: clerkUser.imageUrl || undefined,
      ...adminOverride,
    },
    select: {
      id: true,
      email: true,
      subscriptionPlan: true,
    },
  });

  return {
    userId: user.id,
    email: user.email,
    plan: user.subscriptionPlan,
    clerkUserId,
  };
}
