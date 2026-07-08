import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";

const REFERRAL_EXPIRY_DAYS = 90;
const REWARD_DAYS = 7;

serve(async (req) => {
  console.log("process-referral function called");

  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: the referred user IS the authenticated caller. Ignore any body
    // `referred_user_id` — closes the hole where an unauthenticated caller
    // could grant arbitrary accounts premium.
    const { user, admin: supabaseAdmin } = await requireUser(req);
    await enforceRateLimit(supabaseAdmin, { key: userKey(user.id, "process-referral"), ...RATE_LIMITS.cheap });

    const referred_user_id = user.id;

    let body: { referral_code?: string };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { referral_code } = body;

    if (!referral_code) {
      return json({ error: "referral_code and referred_user_id are required" }, 400);
    }

    console.log("Processing referral:", { referral_code, referred_user_id });

    // 1. Find the referral code
    const { data: referral, error: lookupError } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .eq("referral_code", referral_code)
      .single();

    if (lookupError || !referral) {
      console.log("Referral code not found:", referral_code);
      return json({ error: "invalid_referral_code" }, 404);
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

      return json({ error: "referral_code_expired" }, 410);
    }

    // 3. Check referral isn't already completed
    if (referral.status === "completed") {
      console.log("Referral already completed:", referral.id);
      return json({ error: "referral_already_completed" }, 409);
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
      return json({ error: "user_already_referred" }, 409);
    }

    // 5. Prevent self-referral
    if (referral.referrer_id === referred_user_id) {
      console.log("Self-referral attempted:", referred_user_id);
      return json({ error: "cannot_refer_self" }, 400);
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
      return json({ error: "failed_to_update_referral" }, 500);
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

    return json({
      success: true,
      message: "Referral processed. Both users granted 7 days of premium access.",
      referral_id: referral.id,
    }, 200);
  } catch (e) {
    return toResponse(e);
  }
});
