import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function buildPrompt(
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

function extractGeminiText(data: unknown): string {
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

function extractGeminiError(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const err = (data as Record<string, unknown>).error;
  if (typeof err !== "object" || err === null) return null;
  const msg = (err as Record<string, unknown>).message;
  return typeof msg === "string" ? msg : null;
}

function pathname(url: string | undefined): string {
  if (!url) return "";
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

function handleGenerate(
  apiKey: string | undefined,
  req: IncomingMessage,
  res: ServerResponse,
): void {
  void (async () => {
    if (!apiKey?.trim()) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error:
            "GEMINI_API_KEY is not set. Add your key to the project .env file and restart the dev server.",
        }),
      );
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const type = body.type;
    if (type !== "listing" && type !== "followup") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid or missing type" }));
      return;
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
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid request" }));
      return;
    }

    const url = `${GEMINI_URL}?key=${encodeURIComponent(apiKey.trim())}`;
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
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error:
            err instanceof Error ? err.message : "Request to Gemini failed. Please try again.",
        }),
      );
      return;
    }

    const rawJson = await geminiRes.text();
    let parsed: unknown;
    try {
      parsed = rawJson ? JSON.parse(rawJson) : {};
    } catch {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid response from Gemini." }));
      return;
    }

    if (!geminiRes.ok) {
      const apiErr = extractGeminiError(parsed) ?? rawJson.slice(0, 400);
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: apiErr }));
      return;
    }

    const text = extractGeminiText(parsed);
    if (!text) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "No text in Gemini response. The model may have blocked the output.",
        }),
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.end(text);
  })();
}

export function geminiApiPlugin(apiKey: string | undefined): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (req.method !== "POST" || pathname(req.url) !== "/api/generate") {
      next();
      return;
    }
    handleGenerate(apiKey, req, res);
  };

  return {
    name: "gemini-generate-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
