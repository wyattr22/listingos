import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { json, methodNotAllowed } from "../_lib/http.js";
import { logApiEvent } from "../_lib/logging.js";
import { prisma } from "../_lib/prisma.js";
import { requireAuth } from "../_lib/security.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const priceMap = {
  FREE: "",
  PRO: process.env.STRIPE_PRICE_PRO || "",
  TEAM: process.env.STRIPE_PRICE_TEAM || "",
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  let userId: string | undefined;
  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const plan = body?.plan as "PRO" | "TEAM";

    if (!plan || !priceMap[plan]) {
      return json(res, 400, { error: "Invalid plan" });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user) {
      return json(res, 404, { error: "User not found" });
    }

    let customerId = user.stripeCustomerId || null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: auth.userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.origin || process.env.APP_URL || "http://localhost:8080";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceMap[plan], quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: {
        userId: auth.userId,
        plan,
      },
    });

    await logApiEvent({
      userId,
      endpoint: "/api/stripe/create-checkout-session",
      method: "POST",
      statusCode: 200,
      success: true,
      metadata: { plan },
    });
    return json(res, 200, { url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      userId,
      endpoint: "/api/stripe/create-checkout-session",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
