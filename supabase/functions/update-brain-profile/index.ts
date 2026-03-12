import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, conversation_history } = await req.json();

    if (!user_id || !conversation_history || conversation_history.length < 2) {
      return new Response(JSON.stringify({ success: false, reason: "insufficient_data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing profile
    const { data: existingProfile } = await supabase
      .from("user_brain_profiles")
      .select("profile_summary")
      .eq("user_id", user_id)
      .maybeSingle();

    const existingContext = existingProfile?.profile_summary
      ? `\nExisting student profile:\n${existingProfile.profile_summary}`
      : "";

    // Build conversation text for analysis (limit to last 20 messages)
    const recentMessages = conversation_history.slice(-20);
    const conversationText = recentMessages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    // Call AI to extract profile
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a student profile analyser. Read the conversation below and produce a concise updated student profile summary (max 500 words). Include:
- Subjects studied and exam boards mentioned
- Weak topics or areas they struggle with
- Question types they ask about
- Grade targets or exam dates mentioned
- Recurring struggles or patterns
- Learning style observations
- Progress notes

${existingContext}

Merge new information with the existing profile. Remove outdated info if contradicted. Output ONLY the updated profile summary text, no headers or formatting.`,
          },
          {
            role: "user",
            content: `Conversation:\n${conversationText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify({ success: false, reason: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const profileSummary = aiData.choices?.[0]?.message?.content || "";

    if (!profileSummary.trim()) {
      return new Response(JSON.stringify({ success: false, reason: "empty_profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract subjects and weak topics as arrays for structured storage
    const subjectsMatch = profileSummary.match(/(?:subjects?|studying|exam board)[:\s]*([^\n.]+)/gi) || [];
    const weakMatch = profileSummary.match(/(?:weak|struggle|difficult|confused)[:\s]*([^\n.]+)/gi) || [];

    // Upsert the brain profile
    const { error } = await supabase
      .from("user_brain_profiles")
      .upsert(
        {
          user_id,
          profile_summary: profileSummary.trim(),
          subjects_detected: subjectsMatch.slice(0, 10),
          weak_topics: weakMatch.slice(0, 20),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("DB upsert error:", error);
      return new Response(JSON.stringify({ success: false, reason: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Brain profile updated for user ${user_id} (${profileSummary.length} chars)`);

    return new Response(
      JSON.stringify({ success: true, profile_length: profileSummary.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("update-brain-profile error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
