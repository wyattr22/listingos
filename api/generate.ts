import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateWithGemini } from "../lib/gemini-generate-server.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    res.status(500).json({ error: "Missing GROQ_API_KEY" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = await generateWithGemini(apiKey, body);
    res.status(200).setHeader("Content-Type", "text/plain").send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
}
