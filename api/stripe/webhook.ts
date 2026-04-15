import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { json, methodNotAllowed } from "../_lib/http";
import { logApiEvent } from "../_lib/logging";
import { prisma } from "../_lib/prisma";
import { downgradeExpiredUsers, updatePlan } from "../_lib/subscriptionService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      return json(res, 400, { error: "Missing Stripe webhook signature/secret" });
    }

    const rawBody =
      typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);

    const event = stripe.webhooks.constructEvent(rawBody, signature.toString(), webhookSecret);

    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { provider_eventId: { provider: "stripe", eventId: event.id } },
    });
    if (existing) {
      return json(res, 200, { received: true, deduped: true });
    }

    if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const payload = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;

      const customerId =
        "customer" in payload
          ? typeof payload.customer === "string"
            ? payload.customer
            : payload.customer?.id
          : undefined;

      const subscriptionId =
        "subscription" in payload
          ? typeof payload.subscription === "string"
            ? payload.subscription
            : payload.subscription?.id
          : payload.id;

      if (customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId.toString());
        const priceId = subscription.items.data[0]?.price?.id || null;

        await updatePlan({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        });
      }
    }

    await downgradeExpiredUsers();
    await prisma.processedWebhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
      },
    });
    await logApiEvent({
      endpoint: "/api/stripe/webhook",
      method: "POST",
      statusCode: 200,
      success: true,
      metadata: { eventId: event.id, eventType: event.type },
    });
    return json(res, 200, { received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    await logApiEvent({
      endpoint: "/api/stripe/webhook",
      method: req.method || "UNKNOWN",
      statusCode: 400,
      success: false,
      message,
    });
    return json(res, 400, { error: message });
  }
}
