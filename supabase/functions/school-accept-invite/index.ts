import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

serve(async (req) => {
  console.log("school-accept-invite function called");

  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: require a verified caller and bind the invite to their id. Closes
    // the pre-fix hole where a POST with no Authorization header trusted a body
    // `user_id` and granted school premium to an arbitrary account.
    const { user, admin: supabaseAdmin } = await requireUser(req);
    const user_id = user.id;

    const body = await req.json();
    const { invite_code } = body;

    if (!invite_code) {
      return json({ error: "invite_code is required" }, 400);
    }

    console.log("Accepting invite:", { invite_code, user_id });

    // Find the invite
    const { data: member, error: lookupError } = await supabaseAdmin
      .from("school_members")
      .select("*, school_licenses(*), schools(*)")
      .eq("invite_code", invite_code)
      .maybeSingle();

    if (lookupError || !member) {
      console.log("Invite code not found:", invite_code);
      return json({ error: "Invalid invite code" }, 404);
    }

    // Check if already accepted
    if (member.invite_status === "accepted") {
      return json({ error: "Invite already accepted" }, 409);
    }

    // Check if expired
    if (member.invite_status === "expired") {
      return json({ error: "Invite has expired" }, 410);
    }

    // Get the active license
    const { data: license } = await supabaseAdmin
      .from("school_licenses")
      .select("*")
      .eq("school_id", member.school_id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!license) {
      return json({ error: "School license is no longer active" }, 400);
    }

    // Check license hasn't expired
    if (new Date(license.expires_at) < new Date()) {
      return json({ error: "School license has expired" }, 400);
    }

    // Accept the invite
    const { error: updateError } = await supabaseAdmin
      .from("school_members")
      .update({
        user_id,
        invite_status: "accepted",
        joined_at: new Date().toISOString(),
        license_id: license.id,
      })
      .eq("id", member.id);

    if (updateError) {
      console.error("Failed to accept invite:", updateError);
      return json({ error: "Failed to accept invite" }, 500);
    }

    // Increment used_seats
    const { error: seatError } = await supabaseAdmin
      .from("school_licenses")
      .update({ used_seats: license.used_seats + 1 })
      .eq("id", license.id);

    if (seatError) {
      console.error("Failed to increment seats:", seatError);
    }

    // Grant premium access for ALL active products
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, slug, name")
      .eq("active", true);

    if (products && products.length > 0) {
      for (const product of products) {
        // Check if user already has an active subscription for this product
        const { data: existingSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user_id)
          .eq("product_id", product.id)
          .eq("active", true)
          .maybeSingle();

        if (existingSub) {
          // Extend to license expiry if longer
          const currentEnd = existingSub.subscription_end
            ? new Date(existingSub.subscription_end)
            : new Date();
          const licenseEnd = new Date(license.expires_at);

          if (licenseEnd > currentEnd) {
            await supabaseAdmin
              .from("user_subscriptions")
              .update({
                subscription_end: license.expires_at,
                payment_type: "school",
              })
              .eq("user_id", user_id)
              .eq("product_id", product.id)
              .eq("active", true);
          }
        } else {
          // Create new school subscription
          console.log(
            "Creating school subscription for user:",
            user_id,
            "product:",
            product.slug
          );

          await supabaseAdmin.from("user_subscriptions").insert({
            user_id,
            product_id: product.id,
            tier: "deluxe",
            payment_type: "school",
            active: true,
            subscription_end: license.expires_at,
          });
        }
      }
    }

    // Get school name for response
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", member.school_id)
      .single();

    console.log("Invite accepted successfully:", {
      member_id: member.id,
      user_id,
      school_id: member.school_id,
    });

    return json({
      success: true,
      school_name: school?.name ?? "your school",
    });
  } catch (error) {
    console.error("Unexpected error in school-accept-invite:", error);
    return toResponse(error);
  }
});
