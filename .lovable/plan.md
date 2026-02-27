
## Urgent SEO Recovery Plan (What’s actually happening + ETA)

### What I verified right now
- Your **codebase is fixed** (new sitemap + cleaned metadata).
- But your **live domain is not serving those fixes yet**.
- Evidence:
  - Preview environment sitemap shows updated entries and `lastmod=2026-02-27`.
  - `https://astarai.co.uk/sitemap.xml` is still serving the **old sitemap** (`2026-01-11`, missing newer pages).
- This means Google is still crawling stale production SEO assets, so the “drop” is very likely a **deployment sync issue**, not a penalty from your Build feature.

### Important expectation setting
- I can’t promise an exact minute it returns to #1.
- I can give a realistic window once production serves the corrected files:
  - **Brand query visibility recovery:** often **24–72 hours**
  - **Full ranking stabilization:** typically **3–14 days**
  - Can be faster if Google recrawls quickly; slower if crawl frequency dipped.

## Action plan to fix ASAP

### 1) Force production to serve the corrected build (highest priority)
- Redeploy Vercel from the branch/commit that contains:
  - updated `public/sitemap.xml`
  - cleaned `index.html` metadata setup
- Then immediately verify on live:
  - `https://astarai.co.uk/sitemap.xml` shows `2026-02-27` and all subject URLs
  - `https://astarai.co.uk/robots.txt` still references the sitemap correctly

### 2) Trigger re-crawl immediately
- In Google Search Console:
  - Submit/re-submit `https://astarai.co.uk/sitemap.xml`
  - URL Inspection → Request Indexing for:
    - `/`
    - `/compare`
    - highest-traffic subject pages

### 3) Rule out indexing blockers in GSC
- Check:
  - Manual Actions (should be none)
  - Security Issues (should be none)
  - Pages indexing report for “Crawled - currently not indexed”, “Duplicate”, “Alternate page with canonical”
- If there is a canonical mismatch or duplicate cluster, we’ll adjust canonicals next.

### 4) Monitor next 48 hours
- Track:
  - impressions/clicks for branded queries
  - coverage changes after sitemap re-submit
- If no movement after 72 hours, next step is a deeper audit of:
  - canonical consistency across all routes
  - render parity (server HTML vs hydrated head tags)
  - potential duplicate content across domains

## Technical notes
- Current root cause is most likely **environment drift**:
  - Preview has correct SEO assets
  - Production still serves old assets
- Until production serves updated sitemap/meta setup, Google will continue using stale crawl signals.

## Delivery timeline estimate (practical)
- **Today (within 1 hour):** force correct deploy + verify live sitemap/robots
- **Today to +24h:** submit sitemap + request indexing on key URLs
- **+24 to +72h:** likely return of branded visibility
- **+3 to +14 days:** broader ranking normalization
