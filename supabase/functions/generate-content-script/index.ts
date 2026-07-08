import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chat } from "../_shared/ai.ts";

// Moved server-side so the AI key never ships in the client bundle
// (previously called the Lovable gateway directly from AdminContentHooksPage
// with VITE_LOVABLE_API_KEY, which is baked into the shipped JS).
const SCRIPT_PROMPT = (topic: string, examBoard: string, subject: string, hookType: string) => `You are a content writer for A* AI, a UK A-Level revision platform. Write a 60-second TikTok/YouTube Shorts script about "${topic}" for ${examBoard} ${subject} students.

TONE: Casual, peer-to-peer, UK student voice. Think "your smart friend explaining it to you." NOT corporate or textbook-y. Use "you" and "we." Keep it punchy and conversational.

HOOK TYPE: ${hookType === "question" ? "Start with a provocative question" : hookType === "myth-bust" ? "Start by busting a common misconception" : "Start with a surprising exam tip"}

STRUCTURE (strict):
[HOOK - 3 seconds] An attention-grabbing opening line that makes someone stop scrolling. Must be specific to the topic, not generic.
[SETUP - 10 seconds] What the concept actually is, in plain English. No jargon without explanation.
[CORE - 30 seconds] The key insight — the thing most students get wrong or don't understand. This is the value. Include a specific example or analogy.
[EXAM TIP - 12 seconds] How this specifically shows up in ${examBoard} ${subject} exams. What the examiner wants to see.
[CTA - 5 seconds] "Link in bio for AI-powered revision that actually knows your mark scheme."

FORMAT your response EXACTLY like this (include the section labels):

[HOOK]
(your hook line here)

[SETUP]
(your setup here)

[CORE]
(your core explanation here)

[EXAM TIP]
(your exam tip here)

[CTA]
Link in bio for AI-powered revision that actually knows your mark scheme.`;

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin } = await requireAdmin(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "generate-content-script"), ...RATE_LIMITS.chat });

    let body: { topic?: string; board?: string; subject?: string; hookType?: string };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { topic, board, subject, hookType } = body;
    if (!topic || !board || !subject || !hookType) {
      return err("topic, board, subject and hookType are required", 400);
    }

    // Original call used a single self-contained prompt (no separate system role).
    const scriptText = await chat(
      "",
      SCRIPT_PROMPT(topic, board, subject, hookType),
      "chat",
      { maxTokens: 800, logCtx: { admin, fn: "generate-content-script", userId: user.id } },
    );

    return json({ scriptText });
  } catch (e) {
    return toResponse(e);
  }
});
