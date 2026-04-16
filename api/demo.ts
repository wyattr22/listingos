import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma.js";
import { generateWithGroqPrompt } from "../lib/gemini-generate-server.js";

// 5 requests per IP per 10 minutes
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? "unknown").split(",")[0].trim();
  return ip || "unknown";
}

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - WINDOW_MS);
    const count = await prisma.apiLog.count({
      where: {
        endpoint: "/api/demo",
        createdAt: { gte: since },
        metadata: { path: ["ip"], equals: ip },
      },
    });
    return count >= RATE_LIMIT;
  } catch {
    return false; // fail open if DB is unreachable
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    res.status(500).json({ error: "Service unavailable" });
    return;
  }

  const ip = getIp(req);

  try {
    if (await isRateLimited(ip)) {
      res.status(429).json({ error: "Too many demo requests. Please try again in a few minutes." });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const type = body?.type === "listingprice" ? "listingprice" : "listing";

    let payload: Record<string, string>;
    if (type === "listingprice") {
      const { beds, baths, sqft, condition, neighborhood, features } = body as Record<string, string>;
      if (!neighborhood?.trim() && !features?.trim()) {
        res.status(400).json({ error: "Please enter a neighborhood or key features." });
        return;
      }
      payload = { type, beds: beds ?? "", baths: baths ?? "", sqft: sqft ?? "", condition: condition ?? "Good", neighborhood: (neighborhood ?? "").slice(0, 300), features: (features ?? "").slice(0, 500) };
    } else {
      const features = typeof body?.features === "string" ? body.features.slice(0, 1000) : "";
      if (!features.trim()) {
        res.status(400).json({ error: "Please enter some property details." });
        return;
      }
      payload = { type: "listing", address: "Property provided by user", features, beds: "", baths: "", sqft: "", vibe: "" };
    }

    const text = await generateWithGroqPrompt(apiKey, payload);

    // Send response immediately — don't let a DB write block the user
    res.status(200).setHeader("Content-Type", "text/plain").send(text);

    prisma.apiLog.create({
      data: { endpoint: "/api/demo", method: "POST", statusCode: 200, success: true, metadata: { ip } },
    }).catch(() => {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.apiLog.create({
      data: {
        endpoint: "/api/demo",
        method: "POST",
        statusCode: 502,
        success: false,
        message,
        metadata: { ip },
      },
    }).catch(() => {});
    res.status(502).json({ error: "Generation temporarily unavailable. Please try again." });
  }
}
