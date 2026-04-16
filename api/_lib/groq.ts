import { listingOutputSchema } from "./validation.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type ListingGenerationInput = {
  address: string;
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
      temperature: 0.2,
      max_tokens: 900,
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
    "Write a high-converting real estate listing from only the provided facts.",
    "Optimize for SEO, emotional appeal, and buyer targeting.",
    "Do not invent facts not present in the input.",
    "Output strict JSON only with keys: headline, summary, bullets.",
    "",
    `Address: ${input.address}`,
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
      return listingOutputSchema.parse(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Groq parsing error");
    }
  }

  console.error("Groq listing generation failed; using fallback", lastError);
  return FALLBACK_LISTING;
}
