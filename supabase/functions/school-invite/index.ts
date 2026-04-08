import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  console.log("school-invite function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { school_id, emails, role } = await req.json();

    if (!school_id || !emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "school_id and emails[] are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!["student", "teacher"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "role must be 'student' or 'teacher'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get caller from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Decode the JWT to get user_id
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid auth token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Validate caller is a school admin
    const { data: callerMember, error: memberError } = await supabaseAdmin
      .from("school_members")
      .select("role")
      .eq("school_id", school_id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (memberError || !callerMember) {
      return new Response(
        JSON.stringify({ error: "You are not an admin of this school" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get the active license for seat checking
    const { data: license, error: licenseError } = await supabaseAdmin
      .from("school_licenses")
      .select("*")
      .eq("school_id", school_id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ error: "No active license found for this school" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check seat limits
    const availableSeats = license.total_seats - license.used_seats;
    if (emails.length > availableSeats) {
      return new Response(
        JSON.stringify({
          error: `Not enough seats. Available: ${availableSeats}, requested: ${emails.length}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get school name for the email
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", school_id)
      .single();

    const schoolName = school?.name ?? "your school";

    const invited: string[] = [];
    const errors: string[] = [];

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        errors.push(`Invalid email: ${email}`);
        continue;
      }

      // Check if already invited
      const { data: existing } = await supabaseAdmin
        .from("school_members")
        .select("id, invite_status")
        .eq("school_id", school_id)
        .eq("invited_email", trimmedEmail)
        .maybeSingle();

      if (existing && existing.invite_status === "accepted") {
        errors.push(`${trimmedEmail} is already a member`);
        continue;
      }

      // If pending, reuse record; otherwise create new
      const inviteCode = generateInviteCode();

      if (existing && existing.invite_status === "pending") {
        await supabaseAdmin
          .from("school_members")
          .update({ invite_code: inviteCode, role })
          .eq("id", existing.id);
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("school_members")
          .insert({
            school_id,
            license_id: license.id,
            invited_email: trimmedEmail,
            invite_code: inviteCode,
            role,
            invite_status: "pending",
          });

        if (insertError) {
          console.error("Failed to insert member:", insertError);
          errors.push(`Failed to invite ${trimmedEmail}`);
          continue;
        }
      }

      // Send invite email via Resend if API key is set
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          const inviteUrl = `https://astarai.co.uk/school/join?code=${inviteCode}`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "A* AI <noreply@astarai.co.uk>",
              to: [trimmedEmail],
              subject: `You've been invited to join ${schoolName} on A* AI`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>You've been invited to A* AI</h2>
                  <p>${schoolName} has invited you to join their school on A* AI, the AI-powered revision coach for UK A-Level and GCSE students.</p>
                  <p>Click the link below to accept your invitation and get full premium access:</p>
                  <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Join ${schoolName}</a></p>
                  <p style="color: #666; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
                </div>
              `,
            }),
          });
        } catch (emailError) {
          console.error("Failed to send invite email:", emailError);
          // Don't fail the invite if email fails
        }
      }

      invited.push(trimmedEmail);
    }

    console.log("Invites processed:", { invited: invited.length, errors });

    return new Response(
      JSON.stringify({ invited: invited.length, errors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Unexpected error in school-invite:", error);
    return new Response(
      JSON.stringify({ error: "internal_server_error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
