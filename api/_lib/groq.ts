import { listingOutputSchema } from "./validation.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type ListingGenerationInput = {
  address?: string;
  beds?: string | number;
  baths?: string | number;
  sqft?: string | number;
  features?: string;
  vibe?: string;
  buyerTarget?: string;
  additionalNotes?: string;
};

const FALLBACK_LISTING = {
  headline: "Beautiful Home with Strong Buyer Appeal",
  summary:
    "This property offers a compelling blend of comfort, functionality, and location value based on the details provided. Contact the listing team for full details and a private showing.",
  bullets: [
    "Well-positioned for buyers seeking practical value and lifestyle convenience.",
    "Key home details are highlighted clearly for fast decision-making.",
    "Book a tour to evaluate how this property fits your goals.",
  ],
};

const stripCodeFences = (text: string) => text.replace(/```json|```/gi, "").trim();

async function requestGroq(apiKey: string, prompt: string) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior real-estate copywriter. Return valid JSON only, matching: {headline: string, summary: string, bullets: string[]}. Never include markdown.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Groq request failed");
  }
  return payload?.choices?.[0]?.message?.content || "";
}

export async function generateListingWithGroq(input: ListingGenerationInput): Promise<{
  headline: string;
  summary: string;
  bullets: string[];
}> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const prompt = [
    "Write a professional MLS listing description using ONLY the facts provided. Do not invent details.",
    "",
    "OUTPUT STRUCTURE — return JSON with exactly: { headline, summary, bullets }",
    "- headline: '[X]BR/[X]BA [1-2 standout features] | [sqft] sqft' — include beds, baths, sqft",
    "- summary: THREE paragraphs separated by \\n\\n. Paragraph 1: home itself (address, layout, sqft, beds/baths). Paragraph 2: key features (specific details from input). Paragraph 3: neighborhood/lifestyle (location, distances, vibe).",
    "- bullets: array of exactly 5 strings. First is always '[X] bedrooms, [X] bathrooms, [sqft] sqft'. Next 4 are distinct selling points from features/location.",
    "",
    "BANNED: stunning, charming, cozy, nestled, retreat, oasis, gem, rare opportunity, don't miss, perfect for, endless, boasts, thriving community, pride of ownership, won't last, must-see",
    "- Use concrete numbers. Vary sentence structure. 150-200 words total across paragraphs. No fair housing violations.",
    "",
    "EXAMPLE OUTPUT:",
    `{"headline":"3BR/2BA Steps from Cal Poly with Two-Tier Backyard | 1,450 sqft","summary":"Well-maintained 3-bedroom, 2-bathroom home on a quiet street just blocks from Cal Poly. At 1,450 sqft, the open floor plan connects living and dining areas with an updated kitchen and primary suite with walk-in closet.\\n\\nThe two-tier backyard is the standout — upper patio for grilling and entertaining, lower level for gardening or a fire pit. Kitchen updated with stainless appliances and ample counter space.\\n\\nWalking distance to campus, downtown SLO, and Bishop Peak trailhead. Highway 101 five minutes away, Avila Beach 15 minutes south.","bullets":["3 bedrooms, 2 full bathrooms, 1,450 sqft","Two-tier backyard with upper patio and garden space","Updated kitchen with stainless appliances","Walking distance to Cal Poly and downtown SLO","Attached 2-car garage with laundry hookups"]}`,
    "",
    "Output strict JSON only: { headline, summary, bullets }",
    "",
    `Address: ${input.address ?? "N/A"}`,
    `Beds: ${input.beds ?? "N/A"}`,
    `Baths: ${input.baths ?? "N/A"}`,
    `Sq Ft: ${input.sqft ?? "N/A"}`,
    `Features: ${input.features ?? "N/A"}`,
    `Neighborhood/Style Vibe: ${input.vibe ?? "N/A"}`,
    `Target Buyer: ${input.buyerTarget ?? "N/A"}`,
    `Additional Notes: ${input.additionalNotes ?? "N/A"}`,
  ].join("\n");

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const content = await requestGroq(apiKey, prompt);
      const parsed = JSON.parse(stripCodeFences(content));
      const result = listingOutputSchema.parse(parsed);
      return { headline: result.headline, summary: result.summary, bullets: result.bullets };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Groq parsing error");
    }
  }

  console.error("Groq listing generation failed; using fallback", lastError);
  return FALLBACK_LISTING;
}
