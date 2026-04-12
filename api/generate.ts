import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateWithGemini } from "../lib/gemini-generate-server.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).setHeader("Allow", "POST").json({ error: "Method not allowed" });
    return;
  }

  let body: Record<string, unknown>;
  if (typeof req.body === "string") {
    try {
      body = req.body ? (JSON.parse(req.body) as Record<string, unknown>) : {};
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
  } else if (req.body && typeof req.body === "object") {
    body = req.body as Record<string, unknown>;
  } else {
    body = {};
  }

  const result = await generateWithGemini(process.env.GROQ_API_KEY || "", body);

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res
    .status(200)
    .setHeader("Content-Type", "text/plain; charset=utf-8")
    .setHeader("X-Content-Type-Options", "nosniff")
    .setHeader("Cache-Control", "no-store")
    .send(result.text);
}
