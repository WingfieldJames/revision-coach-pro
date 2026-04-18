import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

// Fallback historical avg cost per prompt (USD) — used if no logged data exists
const FALLBACK_AVG_COST_PER_PROMPT_USD = 0.0024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verify admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const now = new Date();
    const dayMs = 86400000;
    const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
    const startOfWeek = new Date(now.getTime() - 7 * dayMs);
    const startOfMonth = new Date(now.getTime() - 30 * dayMs);
    const startOf60d = new Date(now.getTime() - 60 * dayMs);

    // ---------- STRIPE ----------
    let stripeMetrics: any = {
      mrr_usd: 0,
      daily_revenue_usd: 0,
      revenue_30d: [] as { date: string; usd: number }[],
      new_subs_today: 0,
      new_subs_week: 0,
      new_subs_month: 0,
      cancellations_30d: 0,
      cancellations_prev_30d: 0,
      churn_rate_pct: 0,
      refunds_30d_usd: 0,
      stripe_error: null as string | null,
    };

    if (STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(STRIPE_SECRET_KEY, {
          apiVersion: "2024-06-20",
          httpClient: Stripe.createFetchHttpClient(),
        });

        // MRR — sum active monthly subs normalized to monthly
        let mrr = 0;
        let activeCount = 0;
        for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100 })) {
          activeCount++;
          for (const item of sub.items.data) {
            const price = item.price;
            const unit = (price.unit_amount || 0) * (item.quantity || 1);
            const interval = price.recurring?.interval;
            const intervalCount = price.recurring?.interval_count || 1;
            let monthly = 0;
            if (interval === "month") monthly = unit / intervalCount;
            else if (interval === "year") monthly = unit / (12 * intervalCount);
            else if (interval === "week") monthly = (unit * 4.345) / intervalCount;
            else if (interval === "day") monthly = (unit * 30) / intervalCount;
            mrr += monthly;
          }
        }
        stripeMetrics.mrr_usd = Math.round(mrr) / 100;

        // Charges in last 30d (revenue)
        const dayBuckets = new Map<string, number>();
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - i * dayMs);
          dayBuckets.set(d.toISOString().slice(0, 10), 0);
        }
        let dailyRev = 0;
        const since30 = Math.floor(startOfMonth.getTime() / 1000);
        for await (const ch of stripe.charges.list({
          created: { gte: since30 },
          limit: 100,
        })) {
          if (!ch.paid || ch.refunded) continue;
          const dateStr = new Date(ch.created * 1000).toISOString().slice(0, 10);
          if (dayBuckets.has(dateStr)) {
            dayBuckets.set(dateStr, (dayBuckets.get(dateStr) || 0) + ch.amount);
          }
          if (ch.created * 1000 >= startOfDay.getTime()) {
            dailyRev += ch.amount;
          }
        }
        stripeMetrics.daily_revenue_usd = Math.round(dailyRev) / 100;
        stripeMetrics.revenue_30d = Array.from(dayBuckets.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, cents]) => ({ date, usd: Math.round(cents) / 100 }));

        // Refunds 30d
        let refundCents = 0;
        for await (const r of stripe.refunds.list({
          created: { gte: since30 },
          limit: 100,
        })) {
          refundCents += r.amount;
        }
        stripeMetrics.refunds_30d_usd = Math.round(refundCents) / 100;

        // New subs (created date)
        const since60 = Math.floor(startOf60d.getTime() / 1000);
        let newToday = 0, newWeek = 0, newMonth = 0;
        let cancel30 = 0, cancelPrev30 = 0;
        for await (const sub of stripe.subscriptions.list({
          created: { gte: since60 },
          status: "all",
          limit: 100,
        })) {
          const createdMs = sub.created * 1000;
          if (createdMs >= startOfMonth.getTime()) newMonth++;
          if (createdMs >= startOfWeek.getTime()) newWeek++;
          if (createdMs >= startOfDay.getTime()) newToday++;
          if (sub.canceled_at) {
            const cMs = sub.canceled_at * 1000;
            if (cMs >= startOfMonth.getTime()) cancel30++;
            else if (cMs >= startOf60d.getTime()) cancelPrev30++;
          }
        }
        stripeMetrics.new_subs_today = newToday;
        stripeMetrics.new_subs_week = newWeek;
        stripeMetrics.new_subs_month = newMonth;
        stripeMetrics.cancellations_30d = cancel30;
        stripeMetrics.cancellations_prev_30d = cancelPrev30;
        stripeMetrics.churn_rate_pct = activeCount > 0
          ? Math.round((cancel30 / Math.max(activeCount, 1)) * 1000) / 10
          : 0;
      } catch (e) {
        console.error("Stripe error:", e);
        stripeMetrics.stripe_error = e instanceof Error ? e.message : String(e);
      }
    } else {
      stripeMetrics.stripe_error = "STRIPE_SECRET_KEY not configured";
    }

    // ---------- SUPABASE ----------

    // Active subscribers by tier joined to product
    const { data: subs } = await admin
      .from("user_subscriptions")
      .select("tier, payment_type, product_id, started_at, user_id, products(qualification_type, subject, exam_board)")
      .eq("active", true);

    const subsByTier: Record<string, number> = {};
    const subsByQual: Record<string, number> = { "A Level": 0, "GCSE": 0, "Other": 0 };
    const subsBySubject: Record<string, number> = {};
    const subsByBoard: Record<string, number> = {};
    let paidUsers = 0;
    for (const s of (subs as any[]) || []) {
      paidUsers++;
      const qual = s.products?.qualification_type || "Other";
      const tierKey = `${qual} · ${s.payment_type || s.tier || "unknown"}`;
      subsByTier[tierKey] = (subsByTier[tierKey] || 0) + 1;
      const qb = qual.includes("GCSE") ? "GCSE" : qual.includes("A Level") ? "A Level" : "Other";
      subsByQual[qb]++;
      const subj = s.products?.subject || "Unknown";
      subsBySubject[subj] = (subsBySubject[subj] || 0) + 1;
      const board = s.products?.exam_board || "Unknown";
      subsByBoard[board] = (subsByBoard[board] || 0) + 1;
    }

    // DAU/WAU/MAU
    const { data: usage30 } = await admin
      .from("daily_prompt_usage")
      .select("user_id, usage_date, prompt_count")
      .gte("usage_date", startOfMonth.toISOString().slice(0, 10));
    const dau = new Set<string>();
    const wau = new Set<string>();
    const mau = new Set<string>();
    const todayStr = startOfDay.toISOString().slice(0, 10);
    const weekAgoStr = startOfWeek.toISOString().slice(0, 10);
    let totalPrompts30 = 0;
    const promptsByDay = new Map<string, number>();
    for (const r of (usage30 as any[]) || []) {
      mau.add(r.user_id);
      if (r.usage_date >= weekAgoStr) wau.add(r.user_id);
      if (r.usage_date === todayStr) dau.add(r.user_id);
      totalPrompts30 += r.prompt_count || 0;
      promptsByDay.set(r.usage_date, (promptsByDay.get(r.usage_date) || 0) + (r.prompt_count || 0));
    }
    // DAU yesterday for trend
    const yesterdayStr = new Date(now.getTime() - dayMs).toISOString().slice(0, 10);
    const dauYesterday = new Set<string>();
    for (const r of (usage30 as any[]) || []) {
      if (r.usage_date === yesterdayStr) dauYesterday.add(r.user_id);
    }
    const dauDropPct = dauYesterday.size > 0
      ? Math.round((1 - dau.size / dauYesterday.size) * 1000) / 10
      : 0;

    // Total user count
    const { count: totalUsers } = await admin
      .from("users")
      .select("*", { count: "exact", head: true });

    // Conversion rate = paid users / total users
    const conversionRate = totalUsers && totalUsers > 0
      ? Math.round((paidUsers / totalUsers) * 1000) / 10
      : 0;

    // Avg time-to-conversion (signup → first sub started_at)
    const { data: firstSubs } = await admin
      .from("user_subscriptions")
      .select("user_id, started_at")
      .order("started_at", { ascending: true });
    const firstByUser = new Map<string, string>();
    for (const r of (firstSubs as any[]) || []) {
      if (!firstByUser.has(r.user_id) && r.started_at) firstByUser.set(r.user_id, r.started_at);
    }
    let ttcDaysSum = 0, ttcCount = 0;
    if (firstByUser.size > 0) {
      const userIds = Array.from(firstByUser.keys());
      // Batch in chunks of 200
      for (let i = 0; i < userIds.length; i += 200) {
        const chunk = userIds.slice(i, i + 200);
        const { data: usersRows } = await admin
          .from("users")
          .select("id, created_at")
          .in("id", chunk);
        for (const u of (usersRows as any[]) || []) {
          const sub = firstByUser.get(u.id);
          if (!sub) continue;
          const days = (new Date(sub).getTime() - new Date(u.created_at).getTime()) / dayMs;
          if (days >= 0 && days < 365) {
            ttcDaysSum += days;
            ttcCount++;
          }
        }
      }
    }
    const avgTimeToConversionDays = ttcCount > 0
      ? Math.round((ttcDaysSum / ttcCount) * 10) / 10
      : 0;

    // Sessions / messages
    const { count: convCount } = await admin
      .from("chat_conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());
    const { count: msgCount } = await admin
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());
    const avgSessionsPerUser = mau.size > 0 ? Math.round(((convCount || 0) / mau.size) * 10) / 10 : 0;
    const avgMessagesPerSession = (convCount || 0) > 0 ? Math.round(((msgCount || 0) / (convCount || 1)) * 10) / 10 : 0;

    // ---------- AI COST ----------
    const { data: logs30 } = await admin
      .from("api_usage_logs")
      .select("user_id, feature, input_tokens, output_tokens, estimated_cost_usd, created_at")
      .gte("created_at", startOfMonth.toISOString());

    const costByDay = new Map<string, number>();
    const costByFeature: Record<string, { cost: number; tokens: number; calls: number }> = {};
    const costByUser = new Map<string, number>();
    let loggedCost30 = 0;
    let loggedTokens30 = 0;
    let loggedCalls30 = 0;
    for (const l of (logs30 as any[]) || []) {
      const dateStr = (l.created_at as string).slice(0, 10);
      const cost = Number(l.estimated_cost_usd) || 0;
      costByDay.set(dateStr, (costByDay.get(dateStr) || 0) + cost);
      const f = l.feature || "unknown";
      if (!costByFeature[f]) costByFeature[f] = { cost: 0, tokens: 0, calls: 0 };
      costByFeature[f].cost += cost;
      costByFeature[f].tokens += (l.input_tokens || 0) + (l.output_tokens || 0);
      costByFeature[f].calls += 1;
      if (l.user_id) costByUser.set(l.user_id, (costByUser.get(l.user_id) || 0) + cost);
      loggedCost30 += cost;
      loggedTokens30 += (l.input_tokens || 0) + (l.output_tokens || 0);
      loggedCalls30 += 1;
    }

    // Build 30d AI cost series — combine logged data with historical estimate from daily_prompt_usage
    const avgCostPerPrompt = loggedCalls30 > 0
      ? loggedCost30 / loggedCalls30
      : FALLBACK_AVG_COST_PER_PROMPT_USD;

    const aiCost30d: { date: string; usd: number; estimated: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs).toISOString().slice(0, 10);
      const logged = costByDay.get(d) || 0;
      if (logged > 0) {
        aiCost30d.push({ date: d, usd: Math.round(logged * 10000) / 10000, estimated: false });
      } else {
        const prompts = promptsByDay.get(d) || 0;
        aiCost30d.push({
          date: d,
          usd: Math.round(prompts * avgCostPerPrompt * 10000) / 10000,
          estimated: true,
        });
      }
    }

    const totalAiCost30 = aiCost30d.reduce((sum, d) => sum + d.usd, 0);

    // Top 10 heaviest users by cost
    const userIds = Array.from(costByUser.keys()).slice(0, 200);
    const emailById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: usersRows } = await admin
        .from("users")
        .select("id, email")
        .in("id", userIds);
      for (const u of (usersRows as any[]) || []) emailById.set(u.id, u.email);
    }
    const heaviestUsers = Array.from(costByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, cost]) => ({
        user_id: uid,
        email: emailById.get(uid) || "(unknown)",
        cost_usd: Math.round(cost * 10000) / 10000,
      }));

    // ---------- ALERTS ----------
    const alerts: { level: "red" | "yellow"; message: string }[] = [];
    const totalRevenue30 = stripeMetrics.revenue_30d.reduce((s: number, d: any) => s + d.usd, 0);
    if (totalRevenue30 > 0 && totalAiCost30 / totalRevenue30 > 0.15) {
      alerts.push({ level: "red", message: `AI cost is ${Math.round((totalAiCost30 / totalRevenue30) * 100)}% of revenue (>15%)` });
    }
    const dailyAiSpendUsd = aiCost30d[aiCost30d.length - 1]?.usd || 0;
    const dailyAiSpendGbp = dailyAiSpendUsd * 0.78; // rough USD→GBP
    if (dailyAiSpendGbp > 50) {
      alerts.push({ level: "red", message: `Daily AI spend ~£${dailyAiSpendGbp.toFixed(2)} (>£50)` });
    }
    if (dauDropPct > 20) {
      alerts.push({ level: "yellow", message: `DAU dropped ${dauDropPct}% day-on-day` });
    }
    if (stripeMetrics.churn_rate_pct > 10) {
      alerts.push({ level: "yellow", message: `Monthly churn ${stripeMetrics.churn_rate_pct}% (>10%)` });
    }

    // Gross margin
    const grossMarginPct = totalRevenue30 > 0
      ? Math.round((1 - totalAiCost30 / totalRevenue30) * 1000) / 10
      : 0;

    return json({
      generated_at: now.toISOString(),
      stripe: stripeMetrics,
      supabase: {
        active_subscribers: paidUsers,
        total_users: totalUsers || 0,
        conversion_rate_pct: conversionRate,
        avg_time_to_conversion_days: avgTimeToConversionDays,
        subs_by_tier: subsByTier,
        subs_by_qualification: subsByQual,
        subs_by_subject: subsBySubject,
        subs_by_board: subsByBoard,
        dau: dau.size,
        wau: wau.size,
        mau: mau.size,
        dau_drop_pct: dauDropPct,
        total_prompts_30d: totalPrompts30,
        avg_sessions_per_user: avgSessionsPerUser,
        avg_messages_per_session: avgMessagesPerSession,
      },
      ai: {
        cost_30d_usd: Math.round(totalAiCost30 * 100) / 100,
        cost_by_day: aiCost30d,
        cost_by_feature: Object.entries(costByFeature).map(([feature, v]) => ({
          feature,
          cost_usd: Math.round(v.cost * 10000) / 10000,
          tokens: v.tokens,
          calls: v.calls,
        })),
        heaviest_users: heaviestUsers,
        logged_calls_30d: loggedCalls30,
        logged_tokens_30d: loggedTokens30,
        avg_cost_per_prompt_usd: Math.round(avgCostPerPrompt * 100000) / 100000,
      },
      derived: {
        gross_margin_pct: grossMarginPct,
        ai_cost_pct_of_revenue: totalRevenue30 > 0
          ? Math.round((totalAiCost30 / totalRevenue30) * 1000) / 10
          : 0,
      },
      alerts,
    });
  } catch (e) {
    console.error("get-metrics-dashboard error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
