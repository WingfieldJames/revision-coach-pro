import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = "A* AI <onboarding@resend.dev>";
const APP_URL = "https://astarai.co.uk";
const LOGO_URL = "https://astarai.co.uk/logo.png";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[WEEKLY-PROGRESS] ${step}${detailsStr}`);
};

// Simple keyword-based topic extraction from message content
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Organic Chemistry": ["alkane", "alkene", "alcohol", "ester", "polymer", "organic", "hydrocarbon", "functional group", "isomer"],
  "Inorganic Chemistry": ["ionic", "metallic", "bonding", "electronegativity", "periodicity", "transition metal", "inorganic", "halogen"],
  "Physical Chemistry": ["enthalpy", "entropy", "equilibrium", "kinetics", "rate", "thermodynamics", "hess", "bond energy"],
  "Mechanics": ["force", "momentum", "velocity", "acceleration", "newton", "projectile", "friction", "torque"],
  "Electricity": ["circuit", "resistance", "voltage", "current", "ohm", "capacitor", "resistor", "potential difference"],
  "Waves & Optics": ["wave", "frequency", "wavelength", "diffraction", "interference", "refraction", "standing wave", "electromagnetic"],
  "Nuclear Physics": ["radioactive", "decay", "half-life", "nuclear", "fission", "fusion", "alpha", "beta", "gamma"],
  "Algebra": ["equation", "quadratic", "simultaneous", "inequality", "polynomial", "factori", "expression", "solve"],
  "Calculus": ["differentiat", "integrat", "derivative", "gradient", "tangent", "area under", "chain rule", "product rule"],
  "Statistics": ["probability", "distribution", "standard deviation", "mean", "median", "variance", "hypothesis", "binomial", "normal distribution"],
  "Trigonometry": ["sin", "cos", "tan", "trigonometr", "radian", "identit"],
  "Biology - Cells": ["cell", "mitosis", "meiosis", "organelle", "membrane", "nucleus", "cytoplasm"],
  "Biology - Genetics": ["dna", "gene", "allele", "genotype", "phenotype", "mutation", "inheritance", "chromosome"],
  "Biology - Ecology": ["ecosystem", "food chain", "biodiversity", "population", "habitat", "photosynthesis", "respiration"],
  "Essay Writing": ["essay", "paragraph", "argument", "thesis", "conclusion", "introduction", "evaluate", "discuss", "analyse"],
  "Exam Technique": ["mark scheme", "exam", "marks", "command word", "how many marks", "past paper", "revision"],
};

function extractTopics(messages: string[]): string[] {
  const combined = messages.join(" ").toLowerCase();
  const found: { topic: string; count: number }[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) count++;
    }
    if (count > 0) found.push({ topic, count });
  }

  found.sort((a, b) => b.count - a.count);
  return found.slice(0, 5).map((f) => f.topic);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logStep("ERROR: RESEND_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logStep("ERROR: Failed to send email", { to, error });
      return false;
    }

    logStep("Email sent successfully", { to });
    return true;
  } catch (error) {
    logStep("ERROR: Exception sending email", { to, error: (error as Error).message });
    return false;
  }
}

interface UserStats {
  messageCount: number;
  topicsDiscussed: string[];
  topicCount: number;
  mostActiveSubject: string;
  currentStreak: number;
  dueReviews: number;
}

function buildEmailHtml(firstName: string, stats: UserStats): string {
  const streakEmoji = stats.currentStreak > 0 ? " \uD83D\uDD25" : "";
  const topicsList = stats.topicsDiscussed.length > 0
    ? stats.topicsDiscussed.map((t) => `<span style="display:inline-block;background:#f0ecfb;color:#4f36b3;padding:4px 12px;border-radius:16px;font-size:13px;margin:2px 4px 2px 0;">${t}</span>`).join("")
    : '<span style="color:#6b7280;font-size:14px;">No specific topics detected</span>';

  const reviewSection = stats.dueReviews > 0
    ? `
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#92400e;">Questions to Review</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#a16207;">${stats.dueReviews} question${stats.dueReviews === 1 ? "" : "s"} due for review</p>
                    <a href="${APP_URL}/chat" style="display:inline-block;background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;">Start Reviewing</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);padding:32px 32px 24px;text-align:center;">
              <img src="${LOGO_URL}" alt="A* AI" height="36" style="height:36px;width:auto;margin-bottom:16px;" />
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your Week in Review</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Here's what you accomplished this week</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0;font-size:16px;color:#374151;">Hi ${firstName},</p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding:16px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding:12px 4px;background:#f9fafb;border-radius:12px 0 0 12px;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.messageCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Messages</p>
                  </td>
                  <td width="34%" align="center" style="padding:12px 4px;background:#f9fafb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.topicCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Topics</p>
                  </td>
                  <td width="33%" align="center" style="padding:12px 4px;background:#f9fafb;border-radius:0 12px 12px 0;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.currentStreak}${streakEmoji}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Most Active Subject -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ecfb;border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 2px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Most Active Subject</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#4f36b3;">${stats.mostActiveSubject}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Topics Covered -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Topics Covered</p>
              ${topicsList}
            </td>
          </tr>

          <!-- Due Reviews -->
          ${reviewSection}

          <!-- Motivational CTA -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;font-weight:500;">Keep it up! Consistency is the key to exam success.</p>
              <a href="${APP_URL}/chat" style="display:inline-block;background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:600;font-size:15px;">Continue Studying</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">The A* AI Team</p>
              <a href="${APP_URL}/profile?unsubscribe=true" style="font-size:11px;color:#a1a1aa;text-decoration:underline;">Unsubscribe from weekly emails</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Starting weekly progress email job");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  let usersEmailed = 0;
  let usersSkipped = 0;
  let errors = 0;

  try {
    // 1. Find users who sent at least 1 chat message in the last 7 days
    logStep("Querying active users from last 7 days");

    const { data: activeConversations, error: convError } = await supabase
      .from("chat_messages")
      .select("conversation_id, content, created_at, chat_conversations!inner(user_id)")
      .eq("role", "user")
      .gte("created_at", sevenDaysAgoISO);

    if (convError) {
      logStep("ERROR: Failed to query chat messages", { error: convError.message });
      return new Response(
        JSON.stringify({ success: false, error: convError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group messages by user_id
    const userMessages: Record<string, { messages: string[]; conversationIds: Set<string> }> = {};
    for (const msg of activeConversations || []) {
      const userId = (msg as any).chat_conversations.user_id as string;
      if (!userMessages[userId]) {
        userMessages[userId] = { messages: [], conversationIds: new Set() };
      }
      userMessages[userId].messages.push(msg.content);
      userMessages[userId].conversationIds.add(msg.conversation_id);
    }

    const activeUserIds = Object.keys(userMessages);
    logStep("Found active users", { count: activeUserIds.length });

    if (activeUserIds.length === 0) {
      logStep("No active users found, exiting");
      return new Response(
        JSON.stringify({ users_emailed: 0, users_skipped: 0, errors: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Filter out users who have unsubscribed from weekly recap
    const { data: optedOut, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("weekly_recap", false)
      .in("user_id", activeUserIds);

    if (prefError) {
      logStep("WARNING: Failed to query email preferences, proceeding anyway", { error: prefError.message });
    }

    const optedOutIds = new Set((optedOut || []).map((r: any) => r.user_id));

    // 3. Process each active user
    for (const userId of activeUserIds) {
      if (optedOutIds.has(userId)) {
        logStep("User opted out of weekly recap", { userId });
        usersSkipped++;
        continue;
      }

      try {
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user?.email) {
          logStep("ERROR: Failed to get user email", { userId });
          errors++;
          continue;
        }

        const email = userData.user.email;
        const firstName = userData.user.user_metadata?.first_name ||
          userData.user.user_metadata?.name?.split(" ")[0] ||
          "there";

        // Message count
        const messageCount = userMessages[userId].messages.length;

        // Topics from keyword extraction
        const topicsDiscussed = extractTopics(userMessages[userId].messages);

        // Get products/subjects for conversations
        const conversationIds = Array.from(userMessages[userId].conversationIds);
        const { data: convProducts } = await supabase
          .from("chat_conversations")
          .select("product_id, products(name, subject)")
          .in("id", conversationIds);

        const subjectCounts: Record<string, number> = {};
        for (const cp of convProducts || []) {
          const subjectName = (cp as any).products?.subject || (cp as any).products?.name || "General";
          subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
        }

        const mostActiveSubject =
          Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

        // Get current streak
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .maybeSingle();

        const currentStreak = streakData?.current_streak || 0;

        // Get due reviews count
        const { count: dueReviews } = await supabase
          .from("user_mistakes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("mastered", false)
          .lte("next_review_at", now.toISOString());

        const stats: UserStats = {
          messageCount,
          topicsDiscussed,
          topicCount: topicsDiscussed.length,
          mostActiveSubject,
          currentStreak,
          dueReviews: dueReviews || 0,
        };

        const html = buildEmailHtml(firstName, stats);
        const success = await sendEmail(email, "Your Week in Review \u2B50", html);

        if (success) {
          usersEmailed++;
        } else {
          errors++;
        }

        // Rate limit: 600ms between sends
        await sleep(600);
      } catch (userErr) {
        logStep("ERROR: Exception processing user", { userId, error: (userErr as Error).message });
        errors++;
      }
    }

    const summary = { users_emailed: usersEmailed, users_skipped: usersSkipped, errors };
    logStep("Weekly progress email job completed", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR: Unexpected error", { error: (error as Error).message });
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
