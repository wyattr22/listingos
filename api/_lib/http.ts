import type { VercelResponse } from "@vercel/node";

export const json = (res: VercelResponse, status: number, body: unknown) => {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
};

export const methodNotAllowed = (res: VercelResponse) => json(res, 405, { error: "Method not allowed" });
