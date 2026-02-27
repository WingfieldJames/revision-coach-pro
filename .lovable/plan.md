

## SEO Investigation and Fix Plan

### What I Found

After thoroughly investigating the codebase, **the SEO code itself is fine** -- no `noindex` tags, structured data is correct, meta tags are in place, and `robots.txt` allows all crawlers. The build feature changes did NOT add anything that blocks search engines.

However, there are **two real issues** that need fixing:

---

### Issue 1: Stale Sitemap (High Priority)

The `public/sitemap.xml` file:
- **Last modified dates are all `2026-01-11`** -- over 6 weeks ago. Google uses `lastmod` to decide how often to re-crawl pages. Stale dates signal "nothing changed here."
- **Missing pages** -- the sitemap doesn't include newer subjects:
  - `/edexcel-maths-free-version` and `/edexcel-maths-premium`
  - `/edexcel-maths-applied-free-version` and `/edexcel-maths-applied-premium`
  - `/aqa-chemistry-free-version` and `/aqa-chemistry-premium`
  - `/aqa-psychology-free-version` and `/aqa-psychology-premium`
  - `/build` (probably intentionally excluded, which is fine)

**Fix**: Update all `lastmod` dates to today (`2026-02-27`) and add the missing subject pages.

---

### Issue 2: Duplicate Meta Tags in HTML (Medium Priority)

The `index.html` file has hardcoded meta tags (`<title>`, `og:title`, `og:description`, `twitter:*`), AND the `SEOHead` component (using `react-helmet-async`) injects its own set. This creates **duplicate tags** in the rendered HTML.

While Google typically uses the first `<title>` tag, duplicate `og:` tags can confuse crawlers and social media previews. For the homepage this is harmless (they match), but it's messy and could cause issues on other pages where `SEOHead` tries to override.

**Fix**: Remove the duplicate `<title>` and meta tags from `index.html`, keeping only the essentials that `react-helmet-async` can't handle (like structured data, charset, viewport, and the `<link rel="icon">`). Let `SEOHead` be the single source of truth for all page-specific meta tags.

---

### Why Search Rankings May Have Dropped

Realistically, the build feature changes did not cause an SEO penalty. More likely explanations:
- **Google is re-crawling and re-indexing** after recent changes to the site structure, which can cause temporary ranking fluctuations
- **The stale sitemap** means Google may not be re-crawling your most important pages frequently enough
- Search ranking changes often take days/weeks to settle after significant site updates

---

### Files to Change

1. **`public/sitemap.xml`** -- Update all `lastmod` dates to `2026-02-27`, add 8 missing subject page URLs
2. **`index.html`** -- Remove duplicate `<title>` and `<meta>` tags (keep structured data, charset, viewport, icon, and affiliate script). Let `SEOHead` handle all page-specific meta tags

### What This Won't Change
- The structured data (JSON-LD) stays in `index.html` since `react-helmet-async` handles it less reliably
- The `robots.txt` is already correct
- No new files needed

