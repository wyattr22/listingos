const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildPrompt(body: Record<string, unknown>): { system: string; user: string } {
  if (body.type === "listing") {
    const { address, beds, baths, sqft, features, vibe, buyerTarget } = body as Record<string, string>;
    return {
      system: `You are a professional real estate copywriter. You write MLS descriptions that are ready to post on Zillow, print on flyers, and present to sellers — no editing required.

OUTPUT STRUCTURE (follow exactly, in this order):
1. HEADLINE — format: "[X]BR/[X]BA [1-2 standout features] | [sqft] sqft". Include beds, baths, sqft in headline.
2. OPENING PARAGRAPH — 2-3 sentences about the home itself: address, layout, sqft, bed/bath count, overall condition.
3. FEATURES PARAGRAPH — 2-3 sentences about the key features. Be specific — what does the backyard look like, what's the kitchen like, what's the standout upgrade?
4. NEIGHBORHOOD PARAGRAPH — 2-3 sentences about location/lifestyle. Include real distances, landmarks, or access points from the vibe input.
5. BULLETS — exactly 5. First bullet always states beds/baths/sqft. Next 4 are distinct selling points — no repeating what's already in the paragraphs verbatim.

BANNED: stunning, charming, cozy, nestled, retreat, oasis, gem, rare opportunity, don't miss, perfect for, endless, boasts, thriving community, pride of ownership, won't last, must-see, conveniently located
- Use concrete numbers wherever possible
- Vary sentence structure — do not start consecutive sentences with "The"
- 150-200 words total across the three paragraphs
- No fair housing violations

EXAMPLE (match this style and structure):
---
3BR/2BA Steps from Cal Poly with Two-Tier Backyard | 1,450 sqft

Well-maintained 3-bedroom, 2-bathroom home on a quiet street just blocks from Cal Poly's main campus. At 1,450 sqft, the open floor plan connects the living and dining areas, with an updated kitchen and a primary suite that has its own walk-in closet.

Out back is a two-tier yard — upper patio for grilling and entertaining, lower level for gardening, pets, or a fire pit under the oaks. Kitchen has been updated with stainless appliances and plenty of counter space.

Walking distance to campus, downtown SLO, and the Bishop Peak trailhead. Highway 101 access is five minutes away, and Avila Beach is 15 minutes south.

- 3 bedrooms, 2 full bathrooms, 1,450 sqft
- Two-tier backyard with patio and garden space
- Updated kitchen with stainless appliances
- Walking distance to Cal Poly and downtown SLO
- Attached 2-car garage with laundry hookups
---`,
      user: `Write a full MLS listing description for:
Address: ${address}
Beds: ${beds || "not specified"} | Baths: ${baths || "not specified"} | Sq Ft: ${sqft || "not specified"}
Key Features: ${features || "not provided"}
Neighborhood/Vibe: ${vibe || "not provided"}
${buyerTarget ? `Target Buyer: ${buyerTarget}` : ""}

Output only the listing — headline, three paragraphs, five bullets. No labels. No preamble. Ready to post.`,
    };
  } else if (body.type === "listingprice") {
    const { beds, baths, sqft, condition, neighborhood, features, marketContext } = body as Record<string, unknown>;
    const mc = marketContext as Record<string, number | string | null> | null;
    const sqftNum = parseFloat(String(sqft)) || null;
    const ppsfNum = mc?.medianPpsf ? Math.round(mc.medianPpsf as number) : null;

    const CONDITION_MULT: Record<string, number> = {
      "Needs Work": 0.85, "Good": 0.97, "Move-In Ready": 1.02, "Fully Renovated": 1.08,
    };
    const condMult = CONDITION_MULT[String(condition)] ?? 0.97;
    const baselinePrice = ppsfNum && sqftNum ? Math.round((ppsfNum * sqftNum * condMult) / 5000) * 5000 : null;
    const rangeLow = baselinePrice ? Math.round(baselinePrice * 0.96 / 5000) * 5000 : null;
    const rangeHigh = baselinePrice ? Math.round(baselinePrice * 1.04 / 5000) * 5000 : null;

    const pricingBlock = baselinePrice
      ? `\nPRE-CALCULATED PRICE (based on real Redfin data — use these exact numbers):
Recommended List Price: $${baselinePrice.toLocaleString()}
Range: $${rangeLow!.toLocaleString()} – $${rangeHigh!.toLocaleString()}
Calculation: $${ppsfNum}/sqft (Redfin zip median) × ${sqftNum} sqft × ${condMult} (${condition} condition) = $${baselinePrice.toLocaleString()}
Zip Median Sale Price: $${Number(mc!.medianSalePrice).toLocaleString()}
Median DOM: ${mc!.medianDom} days | Sale-to-List: ${mc!.avgSaleToList ? `${(Number(mc!.avgSaleToList) * 100).toFixed(1)}%` : "N/A"}

Your job: output EXACTLY these prices, then write 3-4 bullets explaining the adjustments.`
      : "";

    return {
      system: `You are a real estate pricing analyst writing rationale for a price that has already been calculated from live market data. Do NOT recalculate or change the price. Just explain the reasoning clearly for the agent to present to sellers.`,
      user: `${pricingBlock || `Recommend a listing price for a ${beds}bd/${baths}ba ${sqft}sqft property in ${neighborhood}, condition: ${condition}, features: ${features || "standard"}.`}

Property: ${beds}bd / ${baths}ba / ${sqft} sqft
Location: ${neighborhood}
Condition: ${condition}
Key Features: ${String(features || "none specified")}

Output format:
Line 1: recommended price (e.g. $1,150,000)
Line 2: range (e.g. $1,105,000 – $1,195,000)
Lines 3+: 3-4 bullet points explaining condition adjustment, location premium, feature impacts, and PPSF vs market.`,
    };
  } else {
    const { guestName, propertyAddress, notes } = body as Record<string, string>;
    return {
      system: `You are a top real estate agent writing follow-up emails after showings. Your emails convert because they feel personal and remember specific details — not like a template blast.

RULES:
- Reference something specific from the showing notes — make it clear you remember them
- One clear call to action (schedule a second showing, answer a specific question, etc.)
- Short: 3 paragraphs max, no filler
- Warm but not sycophantic — skip "It was such a pleasure!" openers
- Sign off naturally`,
      user: `Write a follow-up email to ${guestName || "the buyer"} who toured ${propertyAddress}.
Showing notes: ${notes || "general showing, no specific notes"}

Write the full email, ready to send.`,
    };
  }
}

export async function generateWithGroqPrompt(apiKey: string, body: Record<string, unknown>): Promise<string> {
  const { system, user } = buildPrompt(body);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 2048, temperature: 0.7 })
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

export async function generateCMA(apiKey: string, input: CMAInput, marketSupplement = ""): Promise<CMAOutput> {
  const compsText = input.comps.map((c, i) =>
    `Comp ${i + 1}: ${c.address}, ${c.beds}bd/${c.baths}ba, ${c.sqft} sqft, Sold ${c.salePrice} on ${c.saleDate}${c.notes ? `, Notes: ${c.notes}` : ""}`
  ).join("\n");

  return callGroqJSON<CMAOutput>(
    apiKey,
    `You are a senior real estate market analyst preparing a professional Comparative Market Analysis for an agent to present to a seller.

Return valid JSON only with EXACTLY these keys:
- executiveSummary (string): MUST open with the recommended list price and range on the first sentence (e.g. "Based on X comparable sales, we recommend listing at $X ($X–$X range)."). Then 2 sentences of justification referencing the comps and market conditions.
- marketOverview (string): 1 paragraph on current market conditions — DOM, sale-to-list ratio, inventory, price trends. Use any market data provided.
- compAnalysis (string): 1 paragraph analyzing the comps — note size/condition differences, price adjustments, and what the comps imply for subject pricing.
- pricingRationale (string): 1 paragraph explaining exactly how the recommended price was derived from the comp data. Reference specific comp prices and adjustments.
- recommendedPriceLow (number): lower bound, no symbols
- recommendedPriceHigh (number): upper bound, no symbols
- recommendedPrice (number): exact recommended list price
- marketingStrategy (string): specific strategy for THIS property — name the target buyer persona (investor, family, student, etc.), recommended platforms (Zillow, MLS, Instagram, etc.), staging suggestions based on condition, and optimal days/timing to list.
- keyTalkingPoints (array of exactly 4 strings): agent talking points for the seller meeting — specific, data-backed, no generic filler.`,
    `Prepare a CMA for:\nAddress: ${input.property.address}\nBeds: ${input.property.beds} | Baths: ${input.property.baths} | Sq Ft: ${input.property.sqft}\nCondition: ${input.property.condition}\nFeatures: ${input.property.features}\n\nComparable Sales:\n${compsText}${marketSupplement}\n\nAnalyze these comps and provide a data-driven pricing recommendation.`,
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
    `You are a real estate social media strategist who writes content that actually stops the scroll. You know that generic posts get ignored.

RULES FOR ALL CONTENT:
- NEVER use: stunning, beautiful, incredible, don't miss, dream home, perfect for, excited to announce, valued clients, or any tired real estate clichés
- Lead with the most interesting specific detail about the property — not the price or bed count
- Each platform has a different voice: Instagram is visual and punchy, Facebook is conversational and community-focused, email is direct and professional
- Use the agent's name naturally, not as a formal sign-off
- If there's an open house date, make it feel like an event worth attending

Return ONLY valid JSON matching this EXACT structure, no other keys:
{
  "instagram": { "caption": "...", "hashtags": "..." },
  "facebook": { "post": "..." },
  "openHouse": { "announcement": "..." },
  "emailBlast": { "subject": "...", "body": "..." }
}

- instagram.caption: 180-220 chars, hook first, ends with a question or CTA
- instagram.hashtags: 8-12 hashtags as a single string
- facebook.post: 2 short paragraphs, conversational
- openHouse.announcement: 2-3 sentences with date/time/address
- emailBlast.subject: under 50 chars, specific — NOT "New Listing Alert"
- emailBlast.body: 3 short paragraphs, no "Dear valued clients"`,
    `Property: ${input.address}
${input.beds ? `${input.beds}bd` : ""}${input.baths ? `/${input.baths}ba` : ""}${input.sqft ? ` · ${input.sqft} sqft` : ""}${input.price ? ` · ${input.price}` : ""}
Key Features: ${input.features || "not provided"}
Open House: ${input.openHouseDate || "TBD"}
Agent: ${input.agentName || "the listing agent"}`,
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
