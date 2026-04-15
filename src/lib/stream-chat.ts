/** Resolves to same-origin `/api/generate` (Vite dev middleware or Vercel function). */
function generateUrl(): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base === "/" || base === "" ? "" : base.replace(/\/$/, "");
  return `${prefix}/api/generate`;
}

export async function streamGenerate({
  type,
  payload,
  token,
  onDelta,
  onDone,
  onError,
}: {
  type: "listing" | "followup";
  payload: Record<string, string>;
  token: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(generateUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, ...payload }),
    });

    const contentType = resp.headers.get("content-type") ?? "";

    if (!resp.ok) {
      let message = "Failed to generate. Please try again.";
      const raw = await resp.text();
      if (contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(raw) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          /* ignore */
        }
      } else if (raw) {
        message = raw.slice(0, 300);
      }
      onError(message);
      return;
    }

    if (!resp.body) {
      onError("No response from server.");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onDelta(chunk);
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Unknown error");
  }
}
