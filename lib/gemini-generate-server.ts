/**
 * Shared Gemini generateContent logic for the Vite dev middleware and Vercel serverless.
 */

export const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

export function buildPrompt(
  type: string,
  payload: Record<string, string>,
): { system: string; user: string } {
  if (type === "listing") {
    return {
      system:
        "You are an expert real estate copywriter. Write MLS-style listing descriptions that are compelling, accurate, and compliant with fair housing law (no discriminatory or exclusionary language). Output plain text only, no markdown.",
      user: `Write a professional MLS-ready listing description for this property.

Address: ${payload.address}
Bedrooms: ${payload.beds || "N/A"}
Bathrooms: ${payload.baths || "N/A"}
Square feet: ${payload.sqft || "N/A"}
Key features: ${payload.features || "(none specified)"}
Neighborhood vibe: ${payload.vibe || "(none specified)"}

Write 2–4 short paragraphs. Do not invent specific facts beyond what the inputs reasonably imply.`,
    };
  }
  if (type === "followup") {
    return {
      system:
        "You are assisting a professional real estate agent. Write concise, warm, personalized open-house follow-up emails. Plain text only, no markdown.",
      user: `Write a follow-up email to an open house guest.

Guest name: ${payload.name}
Property they visited: ${payload.address}
Agent's notes from the showing: ${payload.notes || "(none)"}

Format: First line must be the subject, exactly like: Subject: <subject here>
Then one blank line, then the email body. Keep a professional but friendly tone.`,
    };
  }
  throw new Error("Invalid type");
}

export function extractGeminiText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const root = data as Record<string, unknown>;
  const candidates = root.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const parts: string[] = [];
  for (const cand of candidates) {
    if (typeof cand !== "object" || cand === null) continue;
    const content = (cand as Record<string, unknown>).content;
    if (typeof content !== "object" || content === null) continue;
    const blockParts = (content as Record<string, unknown>).parts;
    if (!Array.isArray(blockParts)) continue;
    for (const part of blockParts) {
      if (typeof part === "object" && part !== null && "text" in part) {
        const t = (part as { text?: unknown }).text;
        if (typeof t === "string") parts.push(t);
      }
    }
  }
  return parts.join("");
}

export function extractGeminiError(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const err = (data as Record<string, unknown>).error;
  if (typeof err !== "object" || err === null) return null;
  const msg = (err as Record<string, unknown>).message;
  return typeof msg === "string" ? msg : null;
}

export type GeminiGenerateResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

export async function generateWithGemini(
  apiKey: string | undefined,
  body: Record<string, unknown>,
): Promise<GeminiGenerateResult> {
  if (!apiKey?.trim()) {
    return {
      ok: false,
      status: 500,
      error:
        "GEMINI_API_KEY is not set. Add it to your environment (e.g. .env locally or Vercel project settings).",
    };
  }

  const type = body.type;
  if (type !== "listing" && type !== "followup") {
    return { ok: false, status: 400, error: "Invalid or missing type" };
  }

  const payload: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "type") continue;
    payload[k] = v == null ? "" : String(v);
  }

  let system: string;
  let user: string;
  try {
    ({ system, user } = buildPrompt(type, payload));
  } catch {
    return { ok: false, status: 400, error: "Invalid request" };
  }

  const url = `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey.trim())}`;
  const geminiBody = {
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: user }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error:
        err instanceof Error ? err.message : "Request to Gemini failed. Please try again.",
    };
  }

  const rawJson = await geminiRes.text();
  let parsed: unknown;
  try {
    parsed = rawJson ? JSON.parse(rawJson) : {};
  } catch {
    return { ok: false, status: 502, error: "Invalid response from Gemini." };
  }

  if (!geminiRes.ok) {
    const apiErr = extractGeminiError(parsed) ?? rawJson.slice(0, 400);
    return { ok: false, status: 502, error: apiErr };
  }

  const text = extractGeminiText(parsed);
  if (!text) {
    return {
      ok: false,
      status: 502,
      error: "No text in Gemini response. The model may have blocked the output.",
    };
  }

  return { ok: true, text };
}
