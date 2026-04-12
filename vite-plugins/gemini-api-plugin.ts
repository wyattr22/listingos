import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { generateWithGemini } from "../lib/gemini-generate-server";

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
    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    const result = await generateWithGemini(apiKey, body);

    if (!result.ok) {
      res.statusCode = result.status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: result.error }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.end(result.text);
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
