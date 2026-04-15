import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "../_lib/http";
import { logApiEvent } from "../_lib/logging";
import { requireAuth } from "../_lib/security";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const auth = await requireAuth(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    await logApiEvent({
      userId: auth.userId,
      endpoint: "/api/crm/sync",
      method: "POST",
      statusCode: 202,
      success: true,
    });
    return json(res, 202, {
      message: "CRM sync placeholder accepted",
      userId: auth.userId,
      payload: body ?? {},
      status: "queued",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Server auth misconfigured" ? 500 : 400;
    await logApiEvent({
      endpoint: "/api/crm/sync",
      method: req.method || "UNKNOWN",
      statusCode: status,
      success: false,
      message,
    });
    return json(res, status, { error: message });
  }
}
