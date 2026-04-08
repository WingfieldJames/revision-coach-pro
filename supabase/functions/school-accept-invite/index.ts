import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("school-accept-invite function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invite_code, user_id } = await req.json();

    if (!invite_code || !user_id) {
      return new Response(
        JSON.stringify({ error: "invite_code and user_id are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Accepting invite:", { invite_code, user_id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the invite
    const { data: member, error: lookupError } = await supabaseAdmin
      .from("school_members")
      .select("*, school_licenses(*), schools(*)")
      .eq("invite_code", invite_code)
      .maybeSingle();

    if (lookupError || !member) {
      console.log("Invite code not found:", invite_code);
      return new Response(
        JSON.stringify({ error: "Invalid invite code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Check if already accepted
    if (member.invite_status === "accepted") {
      return new Response(
        JSON.stringify({ error: "Invite already accepted" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        }
      );
    }

    // Check if expired
    if (member.invite_status === "expired") {
      return new Response(
        JSON.stringify({ error: "Invite has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 410,
        }
      );
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
      return new Response(
        JSON.stringify({ error: "School license is no longer active" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check license hasn't expired
    if (new Date(license.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "School license has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Failed to accept invite" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        school_name: school?.name ?? "your school",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Unexpected error in school-accept-invite:", error);
    return new Response(
      JSON.stringify({ error: "internal_server_error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
