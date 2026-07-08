import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chatCompletion } from "../_shared/ai.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: derive the acting user from the verified token. Ignore any
    // body `user_id` — closes the IDOR where a caller could rewrite another
    // student's brain profile.
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "update-brain-profile"), ...RATE_LIMITS.cheap });

    let body: { conversation_history?: Array<{ role: string; content: string }> };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { conversation_history } = body;
    const user_id = user.id;

    if (!conversation_history || conversation_history.length < 2) {
      return json({ success: false, reason: "insufficient_data" });
    }

    // Fetch existing profile
    const { data: existingProfile } = await admin
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
    let profileSummary = "";
    try {
      const { text } = await chatCompletion({
        model: "utility",
        system: `You are a student profile analyser. Read the conversation below and produce a concise updated student profile summary (max 500 words). Include:
- Subjects studied and exam boards mentioned
- Weak topics or areas they struggle with
- Question types they ask about
- Grade targets or exam dates mentioned
- Recurring struggles or patterns
- Learning style observations
- Progress notes

${existingContext}

Merge new information with the existing profile. Remove outdated info if contradicted. Output ONLY the updated profile summary text, no headers or formatting.`,
        messages: [
          {
            role: "user",
            content: `Conversation:\n${conversationText}`,
          },
        ],
        logCtx: { admin, fn: "update-brain-profile", userId: user_id },
      });
      profileSummary = text || "";
    } catch (aiError) {
      console.error("AI error:", aiError);
      return json({ success: false, reason: "ai_error" }, 500);
    }

    if (!profileSummary.trim()) {
      return json({ success: false, reason: "empty_profile" });
    }

    // Extract subjects and weak topics as arrays for structured storage
    const subjectsMatch = profileSummary.match(/(?:subjects?|studying|exam board)[:\s]*([^\n.]+)/gi) || [];
    const weakMatch = profileSummary.match(/(?:weak|struggle|difficult|confused)[:\s]*([^\n.]+)/gi) || [];

    // Upsert the brain profile
    const { error } = await admin
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
      return json({ success: false, reason: "db_error" }, 500);
    }

    console.log(`Brain profile updated for user ${user_id} (${profileSummary.length} chars)`);

    return json({ success: true, profile_length: profileSummary.length });
  } catch (e) {
    return toResponse(e);
  }
});
