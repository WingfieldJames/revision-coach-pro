import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { chatCompletion } from "../_shared/ai.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "A* AI <hello@astarai.co.uk>";
const BASE_URL = "https://astarai.lovable.app";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHURN-DETECTION] ${step}${detailsStr}`);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ChurningUser {
  userId: string;
  email: string;
  subjects: string[];
  weakAreas: string;
}

/**
 * Find active subscribers who have not had a chat conversation updated
 * in the last 7 days and have not already been sent a churn notification.
 */
async function findChurningUsers(
  supabase: SupabaseClient
): Promise<ChurningUser[]> {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // 1. Get active subscribers
  const { data: activeSubs, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("status", "active");

  if (subsError) {
    logStep("ERROR: Failed to query subscriptions", {
      error: subsError.message,
    });
    return [];
  }

  if (!activeSubs || activeSubs.length === 0) {
    logStep("No active subscriptions found");
    return [];
  }

  const activeUserIds: string[] = activeSubs.map(
    (s: { user_id: string }) => s.user_id
  );
  logStep("Active subscribers found", { count: activeUserIds.length });

  // 2. Filter out users who already received a churn notification
  const { data: alreadyNotified, error: notifError } = await supabase
    .from("churn_notifications")
    .select("user_id")
    .eq("notification_type", "churn_7day");

  if (notifError) {
    logStep("ERROR: Failed to query churn_notifications", {
      error: notifError.message,
    });
    return [];
  }

  const notifiedIds = new Set(
    (alreadyNotified || []).map((n: { user_id: string }) => n.user_id)
  );
  const candidateIds = activeUserIds.filter((id) => !notifiedIds.has(id));

  if (candidateIds.length === 0) {
    logStep("All active subscribers already notified or none eligible");
    return [];
  }

  logStep("Candidates after dedup", { count: candidateIds.length });

  // 3. For each candidate, check if they have any recent conversation activity
  const churningUsers: ChurningUser[] = [];

  for (const userId of candidateIds) {
    // Check most recent conversation update
    const { data: recentChat } = await supabase
      .from("chat_conversations")
      .select("updated_at")
      .eq("user_id", userId)
      .gte("updated_at", sevenDaysAgo)
      .limit(1);

    if (recentChat && recentChat.length > 0) {
      // User has been active recently — skip
      continue;
    }

    // User is churning — gather their info
    // Get email from auth
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user?.email) {
      logStep("WARN: Could not fetch user email", { userId });
      continue;
    }

    // Get subjects from their conversations
    const { data: convos } = await supabase
      .from("chat_conversations")
      .select("product_id")
      .eq("user_id", userId);

    const productIds = [
      ...new Set((convos || []).map((c: { product_id: string }) => c.product_id).filter(Boolean)),
    ];

    let subjects: string[] = [];
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("name, subject")
        .in("id", productIds);

      subjects = (products || []).map(
        (p: { name: string; subject: string }) => p.subject || p.name
      );
      subjects = [...new Set(subjects)];
    }

    // Get weak areas from brain profile
    const { data: brainProfile } = await supabase
      .from("user_brain_profiles")
      .select("profile_summary")
      .eq("user_id", userId)
      .maybeSingle();

    const weakAreas = brainProfile?.profile_summary || "";

    churningUsers.push({
      userId,
      email: userData.user.email,
      subjects,
      weakAreas,
    });
  }

  logStep("Churning users identified", { count: churningUsers.length });
  return churningUsers;
}

/**
 * Use the AI gateway to generate a personalised re-engagement message.
 */
async function generatePersonalisedMessage(
  user: ChurningUser
): Promise<string> {
  const subjectList =
    user.subjects.length > 0 ? user.subjects.join(", ") : "their subjects";
  const weakAreaSnippet = user.weakAreas
    ? `Their known weak areas: ${user.weakAreas.slice(0, 500)}`
    : "No specific weak areas recorded yet.";

  const prompt = `You are A* AI, a friendly revision coaching assistant for UK students studying GCSEs and A-Levels.
Write a short, warm "we miss you" email body (3-5 sentences, plain text) for a student who hasn't revised in over a week.

Student's subjects: ${subjectList}
${weakAreaSnippet}

Guidelines:
- Be encouraging, not guilt-tripping
- Mention one or two specific topics or weak areas they could work on
- Suggest they come back for a quick 10-minute revision session
- Keep it casual and student-friendly
- Do NOT include a subject line — just the body text
- Do NOT include any greeting like "Hi" or sign-off like "Best" — those are added separately`;

  try {
    const { text } = await chatCompletion({
      model: "fast",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 300,
    });
    const message = text?.trim();
    return message || getFallbackMessage(subjectList);
  } catch (error) {
    logStep("ERROR: AI gateway exception", { error: (error as Error).message });
    return getFallbackMessage(subjectList);
  }
}

function getFallbackMessage(subjects: string): string {
  return `It's been a little while since your last revision session! Your ${subjects} topics are waiting for you. Even a quick 10-minute session can make a real difference — why not pop back in and tackle a tricky topic today?`;
}

function buildEmailHtml(userName: string, personalMessage: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 460px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 32px 32px 16px;">
              <img src="https://astarai.lovable.app/email-logo.png" alt="A* AI" height="40" style="height: 40px; width: auto;" />
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td align="center" style="padding: 8px 32px 4px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">We miss you${userName ? `, ${userName}` : ""}!</h1>
            </td>
          </tr>
          <!-- Personalised message -->
          <tr>
            <td style="padding: 12px 32px 24px;">
              <p style="margin: 0; font-size: 14px; color: #3f3f46; line-height: 1.6;">
                ${personalMessage}
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 24px;">
              <a href="${BASE_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Start a Quick Session</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 32px 24px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">The A* AI Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logStep("WARN: RESEND_API_KEY not set — logging email instead", {
      to,
      subject,
    });
    return true; // Treat as success so the notification is still recorded
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
    logStep("ERROR: Exception sending email", {
      to,
      error: (error as Error).message,
    });
    return false;
  }
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  logStep("Starting churn detection job");

  let emailsSent = 0;
  let errors = 0;

  try {
    const supabase = requireCronSecret(req);

    const churningUsers = await findChurningUsers(supabase);

    if (churningUsers.length === 0) {
      logStep("No churning users found — nothing to do");
      return json({ success: true, emailsSent: 0, errors: 0 });
    }

    for (const user of churningUsers) {
      try {
        // Generate personalised message via AI
        const personalMessage = await generatePersonalisedMessage(user);

        // Extract first name from email or user metadata
        const { data: authUser } = await supabase.auth.admin.getUserById(
          user.userId
        );
        const userName =
          authUser?.user?.user_metadata?.first_name ||
          authUser?.user?.user_metadata?.name?.split(" ")[0] ||
          "";

        const html = buildEmailHtml(userName, personalMessage);
        const success = await sendEmail(
          user.email,
          "Your revision topics miss you! Come back for a quick session",
          html
        );

        if (success) {
          // Record the notification to prevent duplicates
          const { error: insertError } = await supabase
            .from("churn_notifications")
            .insert({
              user_id: user.userId,
              notification_type: "churn_7day",
            });

          if (insertError) {
            logStep("ERROR: Failed to record churn notification", {
              userId: user.userId,
              error: insertError.message,
            });
            errors++;
          } else {
            emailsSent++;
            logStep("Churn notification recorded", { userId: user.userId });
          }
        } else {
          errors++;
        }

        // Rate limit: 600ms between emails
        await sleep(600);
      } catch (userError) {
        logStep("ERROR: Failed processing user", {
          userId: user.userId,
          error: (userError as Error).message,
        });
        errors++;
      }
    }

    const summary = { emailsSent, errors, totalCandidates: churningUsers.length };
    logStep("Churn detection job completed", summary);

    return json({ success: true, ...summary });
  } catch (error) {
    logStep("ERROR: Unexpected error", { error: (error as Error).message });
    return toResponse(error);
  }
});
