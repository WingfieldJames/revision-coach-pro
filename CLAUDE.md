# A*AI — Claude Code Memory

> **IMPORTANT — EXAM SEASON.** Do not change billing, auth, RLS, migrations, or anything under "Sacred files" until I update this line. Reversible UI/copy changes only. Push back on structural requests.

## Bash commands
- `npm run dev` — start Vite dev server on localhost:8080
- `npm run lint` — eslint (flat config in `eslint.config.js`)
- `npm run preview` — preview built output
- `git push` to `main` — auto-deploys via Vercel to a-star-round-2.vercel.app (~60–90s)
- Use `npm`, never `bun` (despite `bun.lockb` being present)
- No test runner is configured. Do not invent test commands. Flag if a change really needs one.
- `node scripts/model-comparison.mjs` — compares Gemini Flash/Pro and Claude Haiku/Sonnet on marking tasks. Needs `ANTHROPIC_API_KEY` and `LOVABLE_API_KEY`.
- `node seeds/seed-mock-papers.mjs` — seeds JSON files in `seeds/mock_papers/` into Supabase. Needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Stack
- Vite + React 18 + TypeScript, Tailwind, shadcn/ui (slate base, primitives in `src/components/ui/`)
- Path alias: `@/* → src/*`
- Supabase (Postgres + Deno edge functions)
- Stripe billing via edge functions
- Lovable AI Gateway routes Gemini Flash (chat) + Flash Lite (search queries)
- Vercel deploy, SPA rewrites in `vercel.json`
- No staging environment. `main` is production.

## Architecture rules
- Subscription gating lives in `src/lib/productAccess.ts` → `checkProductAccess(userId, productSlug)`. Use it. Do not write parallel gating logic. 7-day grace past `subscription_end`. `BUNDLED_SLUGS` handles parent→child unlocks. Legacy `users.is_premium` fallback applies only to `edexcel-economics`.
- **YOU MUST NOT hardcode Stripe price IDs or price values.** Read `products.lifetime_price` / `monthly_price` from the DB. `create-checkout` builds `price_data` dynamically. The Exam Season Pass is re-priced often.
- Read qualification level (GCSE vs A-Level) from `src/lib/qualification.ts` (backed by `localStorage.qualification_level`). Do not hardcode A-Level grade scales, year options, or default grades.
- Auth and the auto-create-`users`-row flow live in `src/contexts/AuthContext.tsx`. Use `useAuth()`. Do not bypass it.
- RAG logic lives in `supabase/functions/rag-chat/`. Reads `document_chunks` filtered by `metadata.content_type`. Past-paper chunks get a recency bonus.
- Some edge functions intentionally have `verify_jwt = false` in `supabase/config.toml` (webhooks, public endpoints, cron). Do not "fix" this without asking.
- Create new subjects via the Build portal (`/build`), not by hand-rolling `*FreeVersionPage` / `*PremiumPage` files. Dynamic pages render at `/s/:slug/free` and `/s/:slug/premium`.
- Read the live subject list from the `products` table, not from any hardcoded array.

## Sacred files — never edit without explicit sign-off
- `src/lib/productAccess.ts`
- `supabase/functions/stripe-webhook/**`
- `supabase/functions/create-checkout/**`
- `supabase/migrations/**` — always add a new timestamped file, never edit existing
- Any RLS policy
- `src/contexts/AuthContext.tsx`

If any of these looks wrong, flag it. Do not fix silently.

## Code style
- Use the `@/` alias inside `src/`. Never use relative imports that climb out of a directory.
- Put shadcn primitives in `src/components/ui/`. Feature components go directly in `src/components/`.
- Edge functions are Deno (`https://deno.land/...`, `https://esm.sh/...`). Do not share code between `src/` and `supabase/functions/`.
- Write user-facing copy in British English (colour, optimise, organisation, behaviour).
- Student-facing copy: informal, punchy, uses spec/mark-scheme language. Not corporate.
- When changing pricing copy, grep both `src/components/` and `src/pages/` — the same strings are duplicated across surfaces.

## Negative rules
- Never commit `.env` or any Supabase keys.
- Never expose the Supabase service-role key in client (`src/`) code. Service-role usage is for edge functions only.
- Never disable or bypass RLS to "fix" a query. Fix the policy or move the query to a service-role edge function.
- Never hardcode prices, Stripe price IDs, subject slugs, or A-Level assumptions.
- Never edit an existing file in `supabase/migrations/`.

## Workflow
- Plan first for changes to architecture or sacred files. Present the plan, wait for sign-off, then code.
- Skip planning for copy tweaks, single-component fixes, and obvious bug fixes.
- One concern per commit. Atomic. Clear message.
- Do not refactor outside the current task. Flag what you notice; do not fix it.
- Pull before working — Lovable may still commit to `main`. If `git log` shows commits I didn't write, that's Lovable.
- Flag risks I'm unlikely to catch: auth edge cases, race conditions, RLS implications, Stripe webhook idempotency, email deliverability, GDPR/ICO Children's Code.
- B2B is not yet scoped. Do not build B2B infra speculatively.
