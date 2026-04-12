

# Connect Anthropic Claude to Power AI Generation

## Problem
The generate buttons fail because `stream-chat.ts` calls a non-existent Supabase Edge Function. There's no backend to handle AI requests.

## Approach
Create a Supabase Edge Function that proxies requests to the Anthropic Claude API (`claude-haiku-3-5-20251001`). The Anthropic API cannot be called directly from the browser due to CORS restrictions, so a backend proxy is required.

**This requires enabling Lovable Cloud** to deploy edge functions. I'll request Cloud enablement as part of implementation.

## Steps

1. **Enable Lovable Cloud** — needed to deploy edge functions and store secrets
2. **Store the Anthropic API key** as a project secret (`ANTHROPIC_API_KEY`)
3. **Create edge function** `supabase/functions/generate/index.ts` that:
   - Accepts `type` (`listing` or `followup`) plus form fields
   - Builds a tailored system prompt for each type (real estate listing copy vs. follow-up email)
   - Calls Anthropic's Messages API with `claude-haiku-3-5-20251001` and `stream: true`
   - Converts Anthropic's SSE format to OpenAI-compatible SSE format (so the existing `stream-chat.ts` client code works unchanged)
4. **No frontend changes needed** — `stream-chat.ts` already points to the correct URL pattern and parses OpenAI-style SSE

## Technical Details

- **Edge function** handles CORS, validates input, selects system prompt based on `type`, and streams the response
- **System prompts**: One for professional MLS listing descriptions, one for warm follow-up emails
- **Error handling**: 429 (rate limit) and 402 (payment) errors surfaced to the user via toasts (already handled in `stream-chat.ts`)

