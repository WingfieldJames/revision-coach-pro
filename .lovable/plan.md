

# Funnel Analytics Visualization + Leakage Analysis

## What We'll Build

A new "Funnel Analysis" section on the `/analytics` page with three visualizations:

### 1. Conversion Funnel Bar Chart (horizontal)
A stepped funnel showing:
- Signed Up: 2,479
- Used Chatbot: 1,483 (60%)
- Returned 2+ Days: 438 (18%)
- Engaged 4+ Days: 125 (5%)
- Paid: 149 (6%)

Each bar shows the count and % drop-off from the previous step.

### 2. Subject Breakdown Table
Shows per-product: total users, prompt count, subscribers, and conversion rate. Already exists but we'll add it to the funnel context.

### 3. Engagement → Conversion Heatmap/Bar
A grouped bar chart showing engagement buckets (1 day, 2-3 days, 4-7 days, etc.) with two bars per bucket: total users and converted users. This shows exactly where the drop-off happens.

### 4. Days-to-Purchase Distribution
A bar chart showing how many days it takes from signup to purchase (most buy same day).

### 5. Funnel Insights Cards
Auto-calculated insight cards highlighting:
- "40% of users never send a prompt"
- "71% of active users only use it for 1 day"
- "Users who return for 2+ days convert at 8%"

## Implementation

### Edge Function (`get-analytics/index.ts`)
Add new queries to compute:
- `funnelSteps`: array of {label, count, pct} for the funnel
- `engagementBuckets`: array of {bucket, users, converted, conversionRate}
- `daysToPurchase`: distribution of days from signup to first purchase
- `subjectBreakdown`: users/prompts/conversions per product

### Frontend (`AnalyticsPage.tsx`)
Add a new "Funnel Analysis" section between User Growth and Product Analytics with:
- Horizontal funnel bar chart (Recharts BarChart)
- Engagement vs conversion grouped bar chart
- Days-to-purchase histogram
- Insight cards with key metrics

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/get-analytics/index.ts` | Add funnel, engagement bucket, and days-to-purchase queries |
| `src/pages/AnalyticsPage.tsx` | Add Funnel Analysis section with 3 charts + insight cards |

