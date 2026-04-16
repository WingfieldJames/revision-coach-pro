import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user?.email) {
      logStep("ERROR: Auth failed", { error: authError?.message });
      throw new Error(`Authentication failed: ${authError?.message || "No user"}`);
    }

    const user = data.user;
    logStep("User authenticated", { email: user.email, userId: user.id });

    // Parse request body — accept optional subscriptionId to target a specific sub
    const body = await req.json().catch(() => ({}));
    const cancelAtPeriodEnd = body.cancelAtPeriodEnd ?? true;
    const targetSubscriptionId: string | undefined = body.subscriptionId;

    logStep("Request params", { cancelAtPeriodEnd, targetSubscriptionId: targetSubscriptionId || "ALL" });

    // Admin client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Build query for subscriptions to cancel
    let subscriptionsToCancel: any[] = [];

    if (targetSubscriptionId) {
      // Cancel a specific subscription by user_subscriptions.id
      const { data: sub, error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .select("*, products(name, slug)")
        .eq("id", targetSubscriptionId)
        .eq("user_id", user.id)
        .eq("active", true)
        .single();

      if (subError || !sub) {
        logStep("ERROR: Specific subscription not found", { targetSubscriptionId, error: subError?.message });
        throw new Error("Subscription not found or does not belong to you");
      }
      subscriptionsToCancel = [sub];
    } else {
      // No specific ID — cancel ALL active monthly subscriptions for this user
      const { data: subs, error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .select("*, products(name, slug)")
        .eq("user_id", user.id)
        .eq("payment_type", "monthly")
        .eq("active", true);

      if (subError) {
        logStep("ERROR: Failed to fetch subscriptions", { error: subError.message });
      }

      if (subs && subs.length > 0) {
        subscriptionsToCancel = subs;
      } else {
        // Fallback: legacy users table
        logStep("No subs in user_subscriptions, checking legacy table");
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .select("stripe_subscription_id, payment_type, email")
          .eq("id", user.id)
          .single();

        if (userError || !userData) {
          logStep("ERROR: Legacy user lookup failed", { error: userError?.message });
          throw new Error("Failed to fetch subscription information");
        }

        if (userData.payment_type !== "monthly" || !userData.stripe_subscription_id) {
          logStep("No monthly subscription found anywhere");
          return new Response(
            JSON.stringify({ error: "Only monthly subscriptions can be cancelled. Lifetime purchases are permanent." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        subscriptionsToCancel = [{
          stripe_subscription_id: userData.stripe_subscription_id,
          payment_type: userData.payment_type,
          id: null,
          products: null,
        }];
      }
    }

    logStep("Subscriptions to cancel", {
      count: subscriptionsToCancel.length,
      items: subscriptionsToCancel.map((s: any) => ({
        dbId: s.id,
        stripeId: s.stripe_subscription_id,
        product: s.products?.name || "Legacy",
      })),
    });

    // Stripe init
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Process each subscription
    const results: { product: string; success: boolean; error?: string; cancelAt?: number }[] = [];

    for (const sub of subscriptionsToCancel) {
      const stripeSubId = sub.stripe_subscription_id;
      const productName = sub.products?.name || "Legacy subscription";
      const dbId = sub.id;

      if (!stripeSubId) {
        logStep("SKIP: No Stripe ID", { product: productName });
        results.push({ product: productName, success: false, error: "No Stripe subscription ID found" });
        continue;
      }

      try {
        if (cancelAtPeriodEnd) {
          const stripeSub = await stripe.subscriptions.update(stripeSubId, {
            cancel_at_period_end: true,
          });

          logStep("Stripe: cancel_at_period_end set", {
            stripeId: stripeSubId,
            product: productName,
            cancelAt: stripeSub.cancel_at,
            periodEnd: stripeSub.current_period_end,
          });

          // Mark cancelled_at in DB — active stays true until webhook fires customer.subscription.deleted
          if (dbId) {
            await supabaseAdmin
              .from("user_subscriptions")
              .update({
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbId);
          }

          results.push({
            product: productName,
            success: true,
            cancelAt: stripeSub.cancel_at || stripeSub.current_period_end,
          });
        } else {
          // Immediate cancel
          await stripe.subscriptions.cancel(stripeSubId);

          logStep("Stripe: cancelled immediately", { stripeId: stripeSubId, product: productName });

          if (dbId) {
            await supabaseAdmin
              .from("user_subscriptions")
              .update({
                active: false,
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbId);
          }

          // Legacy table cleanup
          await supabaseAdmin
            .from("users")
            .update({
              is_premium: false,
              subscription_tier: null,
              subscription_end: null,
              stripe_subscription_id: null,
              payment_type: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          results.push({ product: productName, success: true });
        }
      } catch (stripeErr: any) {
        logStep("ERROR: Stripe call failed", {
          stripeId: stripeSubId,
          product: productName,
          error: stripeErr.message,
          type: stripeErr.type,
          code: stripeErr.code,
        });
        results.push({ product: productName, success: false, error: stripeErr.message });
      }
    }

    const anySucceeded = results.some((r) => r.success);

    logStep("Done", { results });

    if (!anySucceeded) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to cancel: ${results.map((r) => r.error).join("; ")}`,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const successCount = results.filter((r) => r.success).length;
    const message = cancelAtPeriodEnd
      ? successCount === 1
        ? "Subscription will be cancelled at the end of your billing period"
        : `${successCount} subscription(s) will be cancelled at the end of their billing periods`
      : "Subscription(s) cancelled immediately";

    return new Response(
      JSON.stringify({ success: true, message, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    logStep("ERROR: Unhandled", { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
