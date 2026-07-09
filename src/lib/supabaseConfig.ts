// Public Supabase project URL + anon (publishable) key.
//
// These are client-side PUBLIC values — they already ship in the bundle via the
// generated src/integrations/supabase/client.ts. They live here as plain constants so
// components stop depending on `import.meta.env.VITE_SUPABASE_URL` /
// `VITE_SUPABASE_PUBLISHABLE_KEY`: those env vars became undefined once `.env` was
// untracked and the Vercel build no longer supplied them, which silently broke every
// raw `fetch` built from them — most visibly the deluxe chatbot, whose CHAT_URL became
// `"undefined/functions/v1/rag-chat"` and failed instantly with "Failed to fetch".
//
// Keep in sync with client.ts (same project). Not secret — the anon key is public.
export const SUPABASE_URL = "https://xoipyycgycmpflfnrlty.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXB5eWNneWNtcGZsZm5ybHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzkzMjUsImV4cCI6MjA2OTM1NTMyNX0.pU8Ej1aAvGoAQ6CuVZwvcCvWBxSGo61X16cfQxW7_bI";
