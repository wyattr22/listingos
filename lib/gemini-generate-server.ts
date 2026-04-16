const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildPrompt(body: Record<string, unknown>): { system: string; user: string } {
  if (body.type === "listing") {
    const { address, beds, baths, sqft, features, vibe } = body as Record<string, string>;
    return {
      system: "You are an expert real estate copywriter. Write professional, compelling MLS listing descriptions. Be factual, vivid, and avoid fair housing violations.",
      user: `Write a professional MLS listing description for: Address: ${address}, Beds: ${beds}, Baths: ${baths}, Sq Ft: ${sqft}, Key Features: ${features}, Neighborhood Vibe: ${vibe}`,
    };
  } else if (body.type === "listingprice") {
    const { beds, baths, sqft, condition, neighborhood, features } = body as Record<string, string>;
    return {
      system: "You are a senior real estate pricing specialist. Given property details, provide a realistic suggested listing price range and concise rationale. Format your response as: a price range on the first line (e.g. '$480,000 – $510,000'), then 3-4 short bullet points explaining the reasoning. Be direct and specific.",
      user: `Suggest a listing price range for this property:\nBeds: ${beds}, Baths: ${baths}, Sq Ft: ${sqft}\nCondition: ${condition}\nNeighborhood/Location: ${neighborhood}\nKey Features & Upgrades: ${features}\n\nProvide a price range and brief reasoning bullets.`,
    };
  } else {
    const { guestName, propertyAddress, notes } = body as Record<string, string>;
    return {
      system: "You are a real estate agent writing warm, professional follow-up emails after open houses.",
      user: `Write a follow-up email to ${guestName} who attended an open house at ${propertyAddress}. Notes from showing: ${notes}`,
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

// ── Structured JSON generation (Groq JSON mode) ──────────────────────────────

async function callGroqJSON<T>(apiKey: string, system: string, user: string, maxTokens = 2048): Promise<T> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Groq error");
  return JSON.parse(json.choices[0].message.content) as T;
}

// CMA ─────────────────────────────────────────────────────────────────────────

export type CMAComp = {
  address: string; beds: string; baths: string; sqft: string;
  salePrice: string; saleDate: string; notes: string;
};

export type CMAInput = {
  property: {
    address: string; beds: string; baths: string; sqft: string;
    condition: string; features: string; agentName: string; brokerage: string;
  };
  comps: CMAComp[];
};

export type CMAOutput = {
  executiveSummary: string;
  marketOverview: string;
  compAnalysis: string;
  pricingRationale: string;
  recommendedPriceLow: number;
  recommendedPriceHigh: number;
  recommendedPrice: number;
  marketingStrategy: string;
  keyTalkingPoints: string[];
};

export async function generateCMA(apiKey: string, input: CMAInput): Promise<CMAOutput> {
  const compsText = input.comps.map((c, i) =>
    `Comp ${i + 1}: ${c.address}, ${c.beds}bd/${c.baths}ba, ${c.sqft} sqft, Sold ${c.salePrice} on ${c.saleDate}${c.notes ? `, Notes: ${c.notes}` : ""}`
  ).join("\n");

  return callGroqJSON<CMAOutput>(
    apiKey,
    `You are a senior real estate market analyst preparing a professional Comparative Market Analysis. Return valid JSON only with EXACTLY these keys: executiveSummary (string, 2-3 sentences), marketOverview (string, 1 paragraph), compAnalysis (string, 1 paragraph analyzing the comps), pricingRationale (string, 1 paragraph), recommendedPriceLow (number, no symbols), recommendedPriceHigh (number, no symbols), recommendedPrice (number, the exact suggested price), marketingStrategy (string, 1 paragraph), keyTalkingPoints (array of exactly 4 strings).`,
    `Prepare a CMA for:\nAddress: ${input.property.address}\nBeds: ${input.property.beds} | Baths: ${input.property.baths} | Sq Ft: ${input.property.sqft}\nCondition: ${input.property.condition}\nFeatures: ${input.property.features}\n\nComparable Sales:\n${compsText}\n\nAnalyze these comps and provide a data-driven pricing recommendation.`,
  );
}

// Email Drip ──────────────────────────────────────────────────────────────────

export type DripEmail = { subject: string; body: string; timing: string; label: string; };
export type DripInput = { clientName: string; propertyAddress: string; showingNotes: string; buyerGoals: string; };
export type DripOutput = { emails: DripEmail[] };

export async function generateDrip(apiKey: string, input: DripInput): Promise<DripOutput> {
  return callGroqJSON<DripOutput>(
    apiKey,
    `You are a top-producing real estate agent writing a follow-up drip sequence after a showing. Return valid JSON only with EXACTLY this shape: { "emails": [ { "subject": string, "body": string, "timing": string, "label": string }, ... ] } with exactly 4 email objects. Each body should be 3-5 short paragraphs, warm and professional. No placeholders — write the actual email content using the provided details.`,
    `Write a 4-email drip sequence for:\nClient: ${input.clientName}\nProperty: ${input.propertyAddress}\nShowing notes: ${input.showingNotes}\nBuyer goals: ${input.buyerGoals || "not specified"}\n\nEmail 1 label: "Post-Showing", timing: "Send same day"\nEmail 2 label: "Check-In", timing: "3 days later"\nEmail 3 label: "Value Add", timing: "1 week later"\nEmail 4 label: "Final Nudge", timing: "2 weeks later"`,
  );
}

// Social Content ──────────────────────────────────────────────────────────────

export type SocialInput = {
  address: string; beds: string; baths: string; sqft: string;
  price: string; features: string; openHouseDate: string; agentName: string;
};
export type SocialOutput = {
  instagram: { caption: string; hashtags: string };
  facebook: { post: string };
  openHouse: { announcement: string };
  emailBlast: { subject: string; body: string };
};

export async function generateSocial(apiKey: string, input: SocialInput): Promise<SocialOutput> {
  return callGroqJSON<SocialOutput>(
    apiKey,
    `You are a real estate marketing expert. Return valid JSON only with EXACTLY these keys: instagram (object with caption and hashtags strings), facebook (object with post string), openHouse (object with announcement string), emailBlast (object with subject and body strings). Write compelling, platform-appropriate content. Instagram caption 150-220 chars. Hashtags as a single string. Facebook post 2-3 paragraphs. Open house announcement concise and exciting. Email blast professional with subject line.`,
    `Create social media content for this listing:\nAddress: ${input.address}\nBeds: ${input.beds} | Baths: ${input.baths} | Sq Ft: ${input.sqft}\nPrice: ${input.price}\nKey Features: ${input.features}\nOpen House: ${input.openHouseDate || "TBD"}\nAgent: ${input.agentName || "Contact agent for details"}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
