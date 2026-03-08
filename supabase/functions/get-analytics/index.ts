import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Use service role to check admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Gather all analytics using service role client ----

    // 1. Total users
    const { count: totalUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Daily signups (last 90 days) - get all users and group client-side
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const { data: recentUsers } = await adminClient
      .from("users")
      .select("created_at")
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group by day
    const dailySignups: Record<string, number> = {};
    (recentUsers || []).forEach((u: any) => {
      const day = u.created_at.substring(0, 10);
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    });
    const dailySignupsArray = Object.entries(dailySignups).map(
      ([date, count]) => ({ date, count })
    );

    // 3. Signups this week / this month
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const signupsThisWeek = (recentUsers || []).filter(
      (u: any) => new Date(u.created_at) >= startOfWeek
    ).length;
    const signupsThisMonth = (recentUsers || []).filter(
      (u: any) => new Date(u.created_at) >= startOfMonth
    ).length;
    const signupsToday = (recentUsers || []).filter(
      (u: any) => u.created_at.substring(0, 10) === now.toISOString().substring(0, 10)
    ).length;

    // 4. Subscriptions breakdown
    const { data: allSubs } = await adminClient
      .from("user_subscriptions")
      .select("product_id, payment_type, tier, active, user_id, created_at, subscription_end")
      .order("created_at", { ascending: false });

    const activeSubs = (allSubs || []).filter((s: any) => s.active);
    const totalPaying = activeSubs.length;
    const monthlyCount = activeSubs.filter(
      (s: any) => s.payment_type === "monthly"
    ).length;
    const lifetimeCount = activeSubs.filter(
      (s: any) => s.payment_type === "lifetime"
    ).length;
    const manualCount = activeSubs.filter(
      (s: any) => s.payment_type === "manual"
    ).length;
    const conversionRate = totalUsers ? ((totalPaying / totalUsers!) * 100).toFixed(1) : "0";

    // 5. Products data
    const { data: products } = await adminClient
      .from("products")
      .select("id, name, subject, exam_board, slug, monthly_price, lifetime_price")
      .eq("active", true);

    // 6. Subscriptions by product
    const subsByProduct: Record<string, { name: string; count: number; monthly: number; lifetime: number; manual: number }> = {};
    (products || []).forEach((p: any) => {
      subsByProduct[p.id] = { name: p.name, count: 0, monthly: 0, lifetime: 0, manual: 0 };
    });
    activeSubs.forEach((s: any) => {
      if (subsByProduct[s.product_id]) {
        subsByProduct[s.product_id].count++;
        if (s.payment_type === "monthly") subsByProduct[s.product_id].monthly++;
        else if (s.payment_type === "lifetime") subsByProduct[s.product_id].lifetime++;
        else subsByProduct[s.product_id].manual++;
      }
    });

    // 7. Prompt usage by product (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: promptUsage } = await adminClient
      .from("daily_prompt_usage")
      .select("product_id, usage_date, prompt_count, user_id")
      .gte("usage_date", thirtyDaysAgo.toISOString().substring(0, 10))
      .order("usage_date", { ascending: true });

    // Aggregate prompt usage by product
    const promptsByProduct: Record<string, { totalPrompts: number; uniqueUsers: Set<string> }> = {};
    (promptUsage || []).forEach((p: any) => {
      if (!promptsByProduct[p.product_id]) {
        promptsByProduct[p.product_id] = { totalPrompts: 0, uniqueUsers: new Set() };
      }
      promptsByProduct[p.product_id].totalPrompts += p.prompt_count;
      promptsByProduct[p.product_id].uniqueUsers.add(p.user_id);
    });

    const productUsageArray = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      subject: p.subject,
      examBoard: p.exam_board,
      totalPrompts: promptsByProduct[p.id]?.totalPrompts || 0,
      uniqueUsers: promptsByProduct[p.id]?.uniqueUsers.size || 0,
      subscribers: subsByProduct[p.id]?.count || 0,
    })).sort((a: any, b: any) => b.totalPrompts - a.totalPrompts);

    // Daily prompts aggregated (all products)
    const dailyPrompts: Record<string, number> = {};
    (promptUsage || []).forEach((p: any) => {
      dailyPrompts[p.usage_date] = (dailyPrompts[p.usage_date] || 0) + p.prompt_count;
    });
    const dailyPromptsArray = Object.entries(dailyPrompts).map(
      ([date, count]) => ({ date, count })
    ).sort((a, b) => a.date.localeCompare(b.date));

    // Per-product daily prompts
    const dailyPromptsByProduct: Record<string, Record<string, number>> = {};
    (promptUsage || []).forEach((p: any) => {
      if (!dailyPromptsByProduct[p.product_id]) {
        dailyPromptsByProduct[p.product_id] = {};
      }
      dailyPromptsByProduct[p.product_id][p.usage_date] =
        (dailyPromptsByProduct[p.product_id][p.usage_date] || 0) + p.prompt_count;
    });

    // Convert Sets to counts for serialization
    const serializedPromptsByProduct: Record<string, { totalPrompts: number; uniqueUsers: number }> = {};
    Object.entries(promptsByProduct).forEach(([k, v]) => {
      serializedPromptsByProduct[k] = { totalPrompts: v.totalPrompts, uniqueUsers: v.uniqueUsers.size };
    });

    // 8. Tool usage (all time)
    const { data: toolUsage } = await adminClient
      .from("monthly_tool_usage")
      .select("tool_type, usage_count")
      .limit(1000);

    const toolTotals: Record<string, number> = {};
    (toolUsage || []).forEach((t: any) => {
      toolTotals[t.tool_type] = (toolTotals[t.tool_type] || 0) + t.usage_count;
    });
    const toolUsageArray = Object.entries(toolTotals).map(
      ([tool, count]) => ({ tool, count })
    ).sort((a, b) => b.count - a.count);

    // 9. Recent subscriptions (last 20)
    const recentSubs = (allSubs || []).slice(0, 20).map((s: any) => ({
      product_id: s.product_id,
      product_name: (products || []).find((p: any) => p.id === s.product_id)?.name || "Unknown",
      payment_type: s.payment_type,
      tier: s.tier,
      active: s.active,
      created_at: s.created_at,
      subscription_end: s.subscription_end,
    }));

    // 10. Weekly signups for bar chart
    const weeklySignups: Record<string, number> = {};
    (recentUsers || []).forEach((u: any) => {
      const d = new Date(u.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().substring(0, 10);
      weeklySignups[key] = (weeklySignups[key] || 0) + 1;
    });
    const weeklySignupsArray = Object.entries(weeklySignups)
      .map(([weekOf, count]) => ({ weekOf, count }))
      .sort((a, b) => a.weekOf.localeCompare(b.weekOf));

    // 11. Estimated MRR
    const estimatedMRR = monthlyCount * 8; // Rough avg monthly price

    const response = {
      overview: {
        totalUsers: totalUsers || 0,
        signupsToday,
        signupsThisWeek,
        signupsThisMonth,
        totalPaying,
        conversionRate: parseFloat(conversionRate),
        estimatedMRR,
        activeSubscriptions: activeSubs.length,
        monthlyCount,
        lifetimeCount,
        manualCount,
      },
      dailySignups: dailySignupsArray,
      weeklySignups: weeklySignupsArray,
      productUsage: productUsageArray,
      dailyPrompts: dailyPromptsArray,
      dailyPromptsByProduct,
      toolUsage: toolUsageArray,
      subsByProduct: Object.entries(subsByProduct).map(([id, data]) => ({
        id,
        ...data,
      })),
      recentSubscriptions: recentSubs,
      products: (products || []).map((p: any) => ({ id: p.id, name: p.name })),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
