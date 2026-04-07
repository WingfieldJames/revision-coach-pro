import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REFERRAL_EXPIRY_DAYS = 90;
const REWARD_DAYS = 7;

serve(async (req) => {
  console.log("process-referral function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, referred_user_id } = await req.json();

    if (!referral_code || !referred_user_id) {
      return new Response(
        JSON.stringify({ error: "referral_code and referred_user_id are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing referral:", { referral_code, referred_user_id });

    // Use service role key for DB writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // 1. Find the referral code
    const { data: referral, error: lookupError } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .eq("referral_code", referral_code)
      .single();

    if (lookupError || !referral) {
      console.log("Referral code not found:", referral_code);
      return new Response(
        JSON.stringify({ error: "invalid_referral_code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 2. Check if code is expired (90 days)
    const createdAt = new Date(referral.created_at);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > REFERRAL_EXPIRY_DAYS) {
      console.log("Referral code expired:", { referral_code, daysSinceCreation });
      await supabaseAdmin
        .from("referrals")
        .update({ status: "expired" })
        .eq("id", referral.id);

      return new Response(
        JSON.stringify({ error: "referral_code_expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 410 }
      );
    }

    // 3. Check referral isn't already completed
    if (referral.status === "completed") {
      console.log("Referral already completed:", referral.id);
      return new Response(
        JSON.stringify({ error: "referral_already_completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // 4. Check the referred user hasn't already been referred by someone else
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_user_id)
      .eq("status", "completed")
      .maybeSingle();

    if (existingReferral) {
      console.log("User already referred:", referred_user_id);
      return new Response(
        JSON.stringify({ error: "user_already_referred" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // 5. Prevent self-referral
    if (referral.referrer_id === referred_user_id) {
      console.log("Self-referral attempted:", referred_user_id);
      return new Response(
        JSON.stringify({ error: "cannot_refer_self" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 6. Update referral record
    const { error: updateError } = await supabaseAdmin
      .from("referrals")
      .update({
        referred_id: referred_user_id,
        status: "completed",
        completed_at: new Date().toISOString(),
        reward_granted_referrer: true,
        reward_granted_referred: true,
      })
      .eq("id", referral.id);

    if (updateError) {
      console.error("Failed to update referral:", updateError);
      return new Response(
        JSON.stringify({ error: "failed_to_update_referral" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 7. Grant 7-day premium to BOTH users
    const rewardEndDate = new Date(Date.now() + REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Get all products so we can grant access across them
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, slug, name");

    const userIds = [referral.referrer_id, referred_user_id];

    for (const userId of userIds) {
      if (!products || products.length === 0) {
        console.log("No products found, skipping subscription grant for:", userId);
        continue;
      }

      for (const product of products) {
        // Check if user already has an active subscription for this product
        const { data: existingSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("product_id", product.id)
          .eq("active", true)
          .maybeSingle();

        if (existingSub) {
          // Extend existing subscription by 7 days
          const currentEnd = existingSub.subscription_end
            ? new Date(existingSub.subscription_end)
            : new Date();
          const extendedEnd = new Date(
            Math.max(currentEnd.getTime(), Date.now()) + REWARD_DAYS * 24 * 60 * 60 * 1000
          );

          console.log("Extending subscription for user:", userId, "product:", product.slug, "new end:", extendedEnd.toISOString());

          await supabaseAdmin
            .from("user_subscriptions")
            .update({ subscription_end: extendedEnd.toISOString() })
            .eq("user_id", userId)
            .eq("product_id", product.id)
            .eq("active", true);
        } else {
          // Create new referral subscription
          console.log("Creating referral subscription for user:", userId, "product:", product.slug);

          await supabaseAdmin
            .from("user_subscriptions")
            .insert({
              user_id: userId,
              product_id: product.id,
              tier: "deluxe",
              payment_type: "referral",
              active: true,
              subscription_end: rewardEndDate,
            });
        }
      }
    }

    console.log("Referral processed successfully:", {
      referral_id: referral.id,
      referrer_id: referral.referrer_id,
      referred_id: referred_user_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral processed. Both users granted 7 days of premium access.",
        referral_id: referral.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in process-referral:", error);
    return new Response(
      JSON.stringify({ error: "internal_server_error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
