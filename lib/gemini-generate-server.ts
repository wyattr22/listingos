const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildPrompt(body: Record<string, unknown>): { system: string; user: string } {
  if (body.type === "listing") {
    const { address, beds, baths, sqft, features, vibe } = body as Record<string, string>;
    return {
      system: "You are an expert real estate copywriter. Write professional, compelling MLS listing descriptions. Be factual, vivid, and avoid fair housing violations.",
      user: `Write a professional MLS listing description for: Address: ${address}, Beds: ${beds}, Baths: ${baths}, Sq Ft: ${sqft}, Key Features: ${features}, Neighborhood Vibe: ${vibe}`
    };
  } else {
    const { guestName, propertyAddress, notes } = body as Record<string, string>;
    return {
      system: "You are a real estate agent writing warm, professional follow-up emails after open houses.",
      user: `Write a follow-up email to ${guestName} who attended an open house at ${propertyAddress}. Notes from showing: ${notes}`
    };
  }
}

export async function generateWithGroqPrompt(apiKey: string, body: Record<string, unknown>): Promise<string> {
  const { system, user } = buildPrompt(body);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 1024 })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Groq error");
  return json.choices[0].message.content;
}

export async function generateWithGemini(
  apiKey: string | undefined,
  body: Record<string, unknown>,
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  if (!apiKey) {
    return { ok: false, status: 500, error: "Missing GROQ_API_KEY" };
  }

  try {
    const text = await generateWithGroqPrompt(apiKey, body);
    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : "Groq error",
    };
  }
}
