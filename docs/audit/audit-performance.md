# A* AI — Performance & Scalability Audit

Read-only audit. Owner report: "website is laggy with loads of users." Findings are ranked P0 (falls over at scale) → P2 (minor). Evidence is file:line / migration.

---

## P0-1 — RAG chat fetches the ENTIRE chunk corpus per message and scores it in JavaScript. The vector index is dead code.

**Evidence**
- `supabase/functions/rag-chat/index.ts:444-447` — `fetchRelevantContext` runs:
  ```
  supabase.from('document_chunks').select('content, metadata').eq('product_id', productId)   // NO LIMIT
  ```
  then scores every chunk in-memory (`retrieveWithAIQueries` / `retrieveWithKeywords`, lines 488-650) with `String.split` keyword counting.
- The comment at line 443 ("they're small enough to filter in memory") is the root false assumption.
- `supabase/migrations/20260115114606_...sql:15-16` builds `idx_document_chunks_embedding USING ivfflat` and lines 32-59 define `match_documents()` for vector similarity — **neither is ever called.** `grep '.rpc(' supabase/functions/` shows no call to `match_documents`. The embedding column (1536 floats ≈ 6 KB/row) and its index are pure storage/maintenance overhead with zero query benefit.
- Same full-corpus pattern repeated: `rag-chat/index.ts:981` (search_only path, `.limit(5000)`), `suggest-followups/index.ts:110` (`.limit(1500)`), `detect-content-gaps/index.ts:58`.

**Scale scenario**
Every single chat turn = one `check-subscription`-style full fetch of *all* chunks for that product, transferred to the edge function and scored in JS. A well-trained subject (past papers + mark schemes + spec + guides) is easily 3k-10k chunks. At, say, 300 chars/chunk that is 1-3 MB pulled over the wire and CPU-scored **per message**. Then `suggest-followups` fires after the response and pulls up to 1,500 more. With N concurrent students chatting, the DB does N concurrent full scans of `document_chunks` and the edge runtime does N large JS sorts. This is the single biggest cause of lag under load and it degrades linearly with both corpus size and concurrency.

**Fix**
Actually use pgvector: embed the query and call `match_documents(query_embedding, match_count, filter_product_id)` (already exists) so Postgres returns the top-k via the ivfflat index instead of shipping the whole table. Add `content_type` as a filter arg to the SQL function (currently content-type balancing is done in JS after fetching everything). Set `SET ivfflat.probes` appropriately, or migrate the index to HNSW for better recall/latency. Same treatment for `suggest-followups` and search_only. This converts an O(corpus) transfer+scan into an O(log n) index probe.

---

## P0-2 — No React Query usage at all; auth/access data is re-fetched uncached on every page and component.

**Evidence**
- `src/App.tsx:69` wraps everything in `<QueryClientProvider>`, but `grep -rl 'useQuery|useMutation' src/` returns **0 files**. The cache/dedup/stale-time machinery is present and unused. All data loading is hand-rolled `useEffect` + `supabase.from(...)`.
- `src/lib/productAccess.ts:14-135` `checkProductAccess` does **2-4 sequential round trips every call**: products-by-slug (19-24), user_subscriptions (31-37), school_members (82-86), school_licenses (93-97). No memo/cache — it re-runs on every mount.
- It is called from `Header.tsx:204` (renders on **every route**), `ChatbotSidebar.tsx:204,234`, `ChatbotToolbar.tsx:167`, and nearly every premium page.
- `src/pages/DashboardPage.tsx:81-90` calls `checkProductAccess` for **8 products** in one `Promise.all` → ~16-32 queries on a single dashboard load, then an extra `user_subscriptions` select at line 104. None cached, so navigating away and back re-runs all of it.
- `src/contexts/AuthContext.tsx:87` invokes the `check-subscription` **edge function on every user/mount** (`useEffect [user]`, line 127-133). `check-subscription/index.ts:52-78` loops `user_subscriptions` and, for monthly subs that look expired, makes **synchronous Stripe API calls** to "heal" (line 76-78). So a page load can block on outbound Stripe latency.

**Scale scenario**
Each authenticated navigation triggers: Header's `checkProductAccess` (2-4 queries) + AuthContext's `check-subscription` invocation (DB loop + possible Stripe call) + whatever the page itself refetches. With no caching, a user clicking around 5 pages generates dozens of identical queries. Multiply by concurrent users and the Postgres connection pool and edge concurrency saturate. The Dashboard alone is ~25 queries per view.

**Fix**
Wrap `checkProductAccess`, product lists, and profile/subscription reads in `useQuery` with a sensible `staleTime` (access rarely changes within a session) so the existing `QueryClient` dedupes and caches. Collapse the 8 dashboard checks into one query (single `user_subscriptions` join on `products`, computed client-side) instead of 8× the slug→id→sub round trip. Move `check-subscription` off the hot mount path — call it on login / Stripe-return only, not on every `[user]` effect. Do not let Stripe "healing" run inline on a user-facing request; move it to the webhook or a background cron.

---

## P1-3 — No route-level code splitting; the entire app (all 51 pages + three.js, recharts, framer-motion, katex, html2pdf) ships in one bundle.

**Evidence**
- `src/App.tsx:12-59` statically imports **all 51 page components** at module top. `grep 'React.lazy' src/` finds lazy loading only *inside* `ChatbotSidebar.tsx:178-184` (and those are declared in the render body — see P2-7).
- `vite.config.ts` has **no `build.rollupOptions.manualChunks`**, no chunking strategy.
- Heavy deps all eagerly reachable from the static import graph: `three` + `@react-three/fiber` (`ui/dotted-surface.tsx`, `ui/canvas-reveal-effect.tsx`, `AStarBrainViewer`), `recharts` (`ui/chart.tsx`, `AnalyticsPage`, `MetricsDashboard`), `framer-motion`/`motion`, `katex` + `rehype-katex`, `html2pdf.js`, `mathjs`. `package.json:42,52,55,57,69,76` confirms all are direct deps.

**Scale scenario**
Doesn't degrade with users, but every first-time visitor (incl. the marketing HomePage) downloads and parses a single multi-MB JS bundle containing three.js and the charting/PDF/math stack they may never use. On mobile / slow connections this is the "laggy first paint" users feel. three.js alone is ~150 KB gzipped.

**Fix**
Convert routes in `App.tsx` to `React.lazy` + a `<Suspense>` boundary so each page is its own chunk. Add `manualChunks` in `vite.config.ts` to split vendor bundles (three, recharts, katex, framer-motion). Marketing pages should not pull the WebGL/charting stack.

---

## P1-4 — Metrics/analytics count(*) queries filter on `created_at`, which has no supporting index → sequential scans on the fastest-growing tables.

**Evidence**
- `metrics-snapshot/index.ts:50-58` — `chat_messages` and `chat_conversations` `count exact` with `.gte('created_at', yesterday)`.
- `get-metrics-dashboard/index.ts:229-279` and `get-analytics/index.ts:24-26` — repeated `count('*', { count: 'exact', head: true })` over `users`, `chat_conversations`, `chat_messages`.
- Indexes that exist (migration `20260308223508`): `idx_chat_messages_conversation (conversation_id, created_at)` and `idx_chat_conversations_user_product (user_id, product_id, updated_at)`. A filter on **`created_at` alone** cannot use either (wrong leading column). No standalone `created_at` index on `chat_messages` / `chat_conversations` / `users`.

**Scale scenario**
`count(*)` with `count: 'exact'` forces Postgres to scan every qualifying row. On `chat_messages` (grows with every message from every user) this becomes a full seq scan that gets slower every day. The 5-minute metrics cron and the dashboards (which also poll — see P1-5) run these repeatedly, competing with live chat traffic for I/O.

**Fix**
Add `CREATE INDEX ... ON chat_messages(created_at)`, `chat_conversations(created_at)`, `users(created_at)` (new timestamped migration — never edit existing). For dashboards, prefer `count: 'planned'`/`estimated` or precomputed rollups in `metrics_snapshots` rather than exact counts over live tables.

---

## P1-5 — Client-side polling loops hammer edge functions that run the expensive counts above.

**Evidence**
- `src/pages/AnalyticsPage.tsx:181` — `setInterval(() => fetchAnalytics(true), 30000)` calls `get-analytics` every 30 s.
- `src/pages/MetricsDashboard.tsx:42` — reloads every 5 min.
- `src/pages/MockExamResultsPage.tsx:65` — `setInterval(fetchResult, 5000)` polls every **5 s** while a result is pending.
- `src/pages/BuildPage.tsx:253` — polling interval during deploy.
- `src/contexts/AuthContext.tsx` (P0-2) effectively polls Stripe/DB on every mount.

**Scale scenario**
Each open Analytics/Metrics tab issues the P1-4 seq-scan counts on a fixed cadence regardless of whether data changed. A handful of admin tabs left open generate constant background load. The 5 s mock-exam poll is fine for one user but multiplies per concurrent exam-taker.

**Fix**
Gate `MockExamResultsPage` polling to stop once the result arrives (exponential backoff), and only poll analytics while the tab is visible (`document.visibilityState`). Better: Supabase Realtime subscription for mock-exam result readiness instead of a 5 s poll.

---

## P2-6 — `AuthContext` provider value is not memoised.

**Evidence**: `src/contexts/AuthContext.tsx:202-215` — `const value = { ... }` rebuilt every render, and `signIn`/`signOut`/`refreshProfile` are new function identities each render. The provider wraps the whole app (`App.tsx:71`).
**Impact**: any state change in the provider re-renders the entire consumer tree; consumers depending on the callbacks in effect deps re-run. Moderate, not catastrophic (updates are auth-triggered).
**Fix**: wrap `value` in `useMemo` and the callbacks in `useCallback`.

## P2-7 — `React.lazy` declared inside a component render body.

**Evidence**: `src/components/ChatbotSidebar.tsx:178-184` declares seven `React.lazy(...)` calls **inside** the component, so a new lazy component type is created on every render → React unmounts/remounts those subtrees and re-fetches the chunk, defeating the purpose.
**Fix**: hoist the `React.lazy` calls to module scope.

## P2-8 — `user_subscriptions` access queries lack a composite index for their exact filter.

**Evidence**: `productAccess.ts:31-37` filters `(user_id, product_id, active)`. Migration `20251118123516` provides only separate `idx_user_subscriptions_user_id` and `_product_id`. Postgres can bitmap-and them, but a composite `(user_id, product_id) WHERE active` matches the hot path exactly.
**Impact**: minor at current scale; matters once `user_subscriptions` is large and this runs on every page (P0-2).
**Fix**: `CREATE INDEX ON user_subscriptions(user_id, product_id) WHERE active` (new migration).

---

## Index coverage summary (hot columns)
- `document_chunks.product_id` — indexed (`idx_document_chunks_product`), but the P0-1 query still transfers the whole partition. Vector index present but **unused**.
- `products.slug` — covered by `UNIQUE` constraint (implicit index). OK.
- `user_subscriptions(user_id)`, `(product_id)` — indexed separately; composite recommended (P2-8).
- `school_members(user_id, invite_status)` — indexed (`idx_school_members_user_status`). OK.
- `chat_messages.created_at`, `chat_conversations.created_at`, `users.created_at` — **NOT indexed**, seq-scanned by metrics (P1-4).

## Ranked priority
1. **P0-1** RAG full-corpus fetch + dead vector index — core chat bottleneck.
2. **P0-2** No query caching; access checks + check-subscription re-run every page/mount (Stripe on hot path).
3. **P1-3** No route/vendor code splitting — one giant bundle.
4. **P1-4** Unindexed `created_at` count(*) seq scans in metrics/analytics.
5. **P1-5** Client polling amplifies P1-4.
6. **P2-6/7/8** Auth value memo, lazy-in-render bug, subscription composite index.
