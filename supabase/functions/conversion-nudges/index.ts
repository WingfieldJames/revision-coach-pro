import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Date range: last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    // Step 1: Find free users who hit the daily limit (prompt_count >= 3)
    // on 3 or more of the last 7 days, grouped by user and their most-used product.
    const { data: candidates, error: candidatesError } = await supabase.rpc(
      "get_conversion_candidates",
      { since_date: sevenDaysAgoStr }
    ).select("*");

    // If the RPC doesn't exist yet, fall back to a raw query approach
    // We use a direct SQL query via supabase's REST-compatible approach
    let nudgeCandidates: Array<{
      user_id: string;
      email: string;
      days_at_limit: number;
      product_id: string;
    }> = [];

    if (candidatesError) {
      console.log(
        "RPC not available, using direct queries:",
        candidatesError.message
      );

      // Get all daily_prompt_usage rows where prompt_count >= 3 in the last 7 days
      const { data: usageRows, error: usageError } = await supabase
        .from("daily_prompt_usage")
        .select("user_id, product_id, date")
        .gte("prompt_count", 3)
        .gte("date", sevenDaysAgoStr);

      if (usageError) {
        throw new Error(`Failed to query daily_prompt_usage: ${usageError.message}`);
      }

      if (!usageRows || usageRows.length === 0) {
        return new Response(
          JSON.stringify({ nudged: [], message: "No candidates found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Group by user_id: count distinct days and track product frequency
      const userStats = new Map<
        string,
        { days: Set<string>; productCounts: Map<string, number> }
      >();

      for (const row of usageRows) {
        if (!userStats.has(row.user_id)) {
          userStats.set(row.user_id, {
            days: new Set(),
            productCounts: new Map(),
          });
        }
        const stats = userStats.get(row.user_id)!;
        stats.days.add(row.date);
        stats.productCounts.set(
          row.product_id,
          (stats.productCounts.get(row.product_id) || 0) + 1
        );
      }

      // Filter to users with 3+ days at the limit
      const engagedUserIds: string[] = [];
      const userProductMap = new Map<string, { product_id: string; days: number }>();

      for (const [userId, stats] of userStats) {
        if (stats.days.size >= 3) {
          engagedUserIds.push(userId);
          // Find the most-used product
          let topProduct = "";
          let topCount = 0;
          for (const [productId, count] of stats.productCounts) {
            if (count > topCount) {
              topProduct = productId;
              topCount = count;
            }
          }
          userProductMap.set(userId, {
            product_id: topProduct,
            days: stats.days.size,
          });
        }
      }

      if (engagedUserIds.length === 0) {
        return new Response(
          JSON.stringify({ nudged: [], message: "No candidates found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 2: Exclude users with active subscriptions
      const { data: activeSubs, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id")
        .in("user_id", engagedUserIds)
        .eq("status", "active");

      if (subsError) {
        throw new Error(`Failed to query subscriptions: ${subsError.message}`);
      }

      const payingUserIds = new Set(
        (activeSubs || []).map((s: { user_id: string }) => s.user_id)
      );
      const freeEngagedUserIds = engagedUserIds.filter(
        (id) => !payingUserIds.has(id)
      );

      if (freeEngagedUserIds.length === 0) {
        return new Response(
          JSON.stringify({
            nudged: [],
            message: "All engaged users are already subscribed",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 3: Exclude users already nudged with this nudge type
      const { data: existingNudges, error: nudgesError } = await supabase
        .from("conversion_nudges")
        .select("user_id")
        .in("user_id", freeEngagedUserIds)
        .eq("nudge_type", "limit_hit_3days");

      if (nudgesError) {
        throw new Error(
          `Failed to query conversion_nudges: ${nudgesError.message}`
        );
      }

      const alreadyNudgedIds = new Set(
        (existingNudges || []).map((n: { user_id: string }) => n.user_id)
      );
      const toNudgeUserIds = freeEngagedUserIds.filter(
        (id) => !alreadyNudgedIds.has(id)
      );

      if (toNudgeUserIds.length === 0) {
        return new Response(
          JSON.stringify({
            nudged: [],
            message: "All candidates have already been nudged",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 4: Fetch emails from auth.users
      const { data: usersData, error: usersError } =
        await supabase.auth.admin.listUsers();

      if (usersError) {
        throw new Error(`Failed to list users: ${usersError.message}`);
      }

      const emailMap = new Map<string, string>();
      for (const user of usersData.users) {
        if (toNudgeUserIds.includes(user.id)) {
          emailMap.set(user.id, user.email || "");
        }
      }

      // Step 5: Record nudges in conversion_nudges table
      const nudgeRecords = toNudgeUserIds.map((userId) => ({
        user_id: userId,
        nudge_type: "limit_hit_3days",
        product_id: userProductMap.get(userId)?.product_id || null,
      }));

      const { error: insertError } = await supabase
        .from("conversion_nudges")
        .insert(nudgeRecords);

      if (insertError) {
        throw new Error(
          `Failed to insert nudge records: ${insertError.message}`
        );
      }

      // Build response
      nudgeCandidates = toNudgeUserIds.map((userId) => ({
        user_id: userId,
        email: emailMap.get(userId) || "",
        days_at_limit: userProductMap.get(userId)?.days || 0,
        product_id: userProductMap.get(userId)?.product_id || "",
      }));
    } else {
      // RPC succeeded — use its results directly
      nudgeCandidates = candidates || [];
    }

    console.log(
      `Conversion nudge candidates identified: ${nudgeCandidates.length}`
    );

    return new Response(
      JSON.stringify({
        nudged: nudgeCandidates,
        count: nudgeCandidates.length,
        message: `${nudgeCandidates.length} user(s) identified for conversion nudge`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("conversion-nudges error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
