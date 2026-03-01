import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE_STRIPE_STATUSES = new Set(["active", "trialing", "past_due"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
        auth: { persistSession: false },
      }
    );

    const { data, error: authError } = await supabaseAdmin.auth.getUser();
    const user = data?.user;

    if (authError || !user?.id) {
      console.log("Auth token invalid or no user, returning default free subscription status");
      return new Response(
        JSON.stringify({
          is_premium: false,
          subscription_tier: null,
          subscription_end: null,
          healed_subscriptions: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedProductId = typeof body?.product_id === "string" ? body.product_id : null;

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeSecret
      ? new Stripe(stripeSecret, {
          apiVersion: "2023-10-16",
          httpClient: Stripe.createFetchHttpClient(),
        })
      : null;

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("id, product_id, tier, payment_type, active, subscription_end, stripe_subscription_id, cancelled_at")
      .eq("user_id", user.id)
      .eq("active", true);

    if (subError) {
      console.error("Error fetching user_subscriptions:", subError);
    }

    const now = new Date();
    let healedSubscriptions = 0;
    let anyPremium = false;
    let bestSubscriptionEnd: string | null = null;
    let requestedProductPremium = false;

    for (const sub of subscriptions || []) {
      const isDeluxe = sub.tier === "deluxe";
      const hasEnd = !!sub.subscription_end;
      const endDate = hasEnd ? new Date(sub.subscription_end as string) : null;
      let isValid = isDeluxe && (!endDate || endDate > now);
      let normalizedEnd: string | null = sub.subscription_end;

      if (!isValid && isDeluxe && sub.payment_type === "monthly" && sub.stripe_subscription_id && stripe) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
          const status = stripeSub.status;
          const currentPeriodEndIso = new Date(stripeSub.current_period_end * 1000).toISOString();
          const stripeLooksActive = ACTIVE_STRIPE_STATUSES.has(status);

          if (stripeLooksActive && new Date(currentPeriodEndIso) > now) {
            const { error: healError } = await supabaseAdmin
              .from("user_subscriptions")
              .update({
                active: true,
                cancelled_at: null,
                subscription_end: currentPeriodEndIso,
                updated_at: new Date().toISOString(),
              })
              .eq("id", sub.id);

            if (!healError) {
              healedSubscriptions += 1;
              normalizedEnd = currentPeriodEndIso;
              isValid = true;
              console.log("Healed monthly subscription from Stripe", {
                user_id: user.id,
                sub_id: sub.id,
                stripe_subscription_id: sub.stripe_subscription_id,
                current_period_end: currentPeriodEndIso,
              });
            } else {
              console.error("Failed to heal monthly subscription", healError);
            }
          }
        } catch (stripeErr) {
          console.error("Stripe verification failed for subscription", {
            stripe_subscription_id: sub.stripe_subscription_id,
            error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
          });
        }
      }

      if (isValid) {
        anyPremium = true;
        if (!bestSubscriptionEnd || (normalizedEnd && new Date(normalizedEnd) > new Date(bestSubscriptionEnd))) {
          bestSubscriptionEnd = normalizedEnd;
        }

        if (!requestedProductId || sub.product_id === requestedProductId) {
          requestedProductPremium = true;
        }
      }
    }

    // Keep legacy users table aligned for backward compatibility.
    const { error: updateUsersError } = await supabaseAdmin
      .from("users")
      .update({
        is_premium: anyPremium,
        subscription_tier: anyPremium ? "Deluxe" : null,
        subscription_end: anyPremium ? bestSubscriptionEnd : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateUsersError) {
      console.error("Failed to sync users table from check-subscription", updateUsersError);
    }

    return new Response(
      JSON.stringify({
        is_premium: anyPremium,
        subscription_tier: anyPremium ? "Deluxe" : null,
        subscription_end: anyPremium ? bestSubscriptionEnd : null,
        healed_subscriptions: healedSubscriptions,
        ...(requestedProductId
          ? {
              product_id: requestedProductId,
              product_tier: requestedProductPremium ? "deluxe" : "free",
              has_product_access: requestedProductPremium,
            }
          : {}),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});