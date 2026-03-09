import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_URL = "https://astarai.lovable.app";
const FROM_EMAIL = "A* AI <onboarding@resend.dev>"; // Using Resend test sender until astarai.co.uk is verified

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FEEDBACK-EMAILS] ${step}${detailsStr}`);
};

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logStep("ERROR: RESEND_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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
    logStep("ERROR: Exception sending email", { to, error: error.message });
    return false;
  }
}

function getFreeUserEmailHtml(feedbackUrl: string): string {
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
              <img src="https://astarai.lovable.app/brand-logo.png" alt="A* AI" height="40" style="height: 40px; width: auto;" />
            </td>
          </tr>
          <!-- Stars decoration -->
          <tr>
            <td align="center" style="padding: 0 32px 8px;">
              <span style="font-size: 28px;">⭐⭐⭐⭐⭐</span>
            </td>
          </tr>
          <!-- Heading -->
          <tr>
            <td align="center" style="padding: 8px 32px 4px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">How's your experience?</h1>
            </td>
          </tr>
          <!-- Subtext -->
          <tr>
            <td align="center" style="padding: 4px 32px 24px;">
              <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
                You've been using A* AI for 2 weeks now. We'd love your honest feedback — it takes 30 seconds.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 24px;">
              <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Submit Feedback</a>
            </td>
          </tr>
          <!-- Upgrade CTA -->
          <tr>
            <td style="padding: 0 32px 24px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 16px 0 8px; font-size: 13px; color: #71717a; text-align: center;">Ready to unlock unlimited access?</p>
              <p style="margin: 0; text-align: center;">
                <a href="https://astarai.lovable.app/compare" style="font-size: 13px; color: #667eea; text-decoration: none; font-weight: 600;">Upgrade to Deluxe →</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 32px 24px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">The A* AI Team</p>
              <a href="https://astarai.lovable.app" style="font-size: 12px; color: #667eea; text-decoration: none;">astarai.lovable.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getDeluxeUserEmailHtml(feedbackUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; margin-bottom: 10px;">How's Deluxe treating you? ⭐</h1>
  </div>
  
  <p>Hey there! 👋</p>
  
  <p>You've been a Deluxe member for 2 weeks now — thank you for your support!</p>
  
  <p>We'd love to hear how the premium features are working for you. Your feedback directly shapes what we build next:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Share Your Deluxe Feedback</a>
  </div>
  
  <p>Is there a feature you wish we had? Something that could work better? We're all ears!</p>
  
  <p>Thanks for helping us build the best A-Level study tool! 🚀</p>
  
  <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    The A* AI Team<br>
    <a href="https://astarai.lovable.app" style="color: #f5576c;">astarai.lovable.app</a>
  </p>
</body>
</html>
  `.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Test mode: send a test email to a specific address
  try {
    const body = await req.json().catch(() => ({}));
    if (body.test_email) {
      const type = body.type || "free";
      const feedbackUrl = `${BASE_URL}/feedback?type=${type}`;
      const html = type === "deluxe" 
        ? getDeluxeUserEmailHtml(feedbackUrl) 
        : getFreeUserEmailHtml(feedbackUrl);
      const subject = type === "deluxe" 
        ? "How's Deluxe treating you? ⭐" 
        : "How's your A* AI experience? 📚";
      
      const success = await sendEmail(body.test_email, subject, html);
      return new Response(JSON.stringify({ success, test: true, to: body.test_email }), {
        status: success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (_) {}

  logStep("Starting feedback email job");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();

  let freeEmailsSent = 0;
  let deluxeEmailsSent = 0;
  let errors = 0;

  try {
    // ============================================
    // 1. Send emails to free users (14 days after signup)
    // ============================================
    logStep("Querying free users who signed up 14+ days ago");

    // Get users from auth.users who signed up 14+ days ago
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      logStep("ERROR: Failed to list auth users", { error: authError.message });
    } else {
      // Filter users who signed up 14+ days ago
      const eligibleFreeUsers = authUsers.users.filter(user => {
        const createdAt = new Date(user.created_at);
        return createdAt <= fourteenDaysAgo;
      });

      logStep("Found eligible free users", { count: eligibleFreeUsers.length });

      for (const user of eligibleFreeUsers) {
        // Check if we already sent this email
        const { data: existingSend } = await supabase
          .from('feedback_emails_sent')
          .select('id')
          .eq('user_id', user.id)
          .eq('email_type', 'free_14d')
          .maybeSingle();

        if (existingSend) {
          continue; // Already sent
        }

        // Send the email
        const feedbackUrl = `${BASE_URL}/feedback?type=free`;
        const success = await sendEmail(
          user.email!,
          "How's your A* AI experience? 📚",
          getFreeUserEmailHtml(feedbackUrl)
        );

        if (success) {
          // Record the send
          const { error: insertError } = await supabase
            .from('feedback_emails_sent')
            .insert({
              user_id: user.id,
              email_type: 'free_14d'
            });

          if (insertError) {
            logStep("ERROR: Failed to record email send", { userId: user.id, error: insertError });
            errors++;
          } else {
            freeEmailsSent++;
          }
        } else {
          errors++;
        }

        // Rate limit: wait 600ms between emails (max ~1.6/sec)
        await sleep(600);
      }
    }

    // ============================================
    // 2. Send emails to Deluxe users (14 days after upgrade)
    // ============================================
    logStep("Querying Deluxe users who upgraded 14+ days ago");

    const { data: deluxeUsers, error: deluxeError } = await supabase
      .from('user_subscriptions')
      .select('user_id, created_at')
      .eq('tier', 'deluxe')
      .eq('active', true)
      .lte('created_at', fourteenDaysAgoISO);

    if (deluxeError) {
      logStep("ERROR: Failed to query deluxe users", { error: deluxeError.message });
    } else {
      logStep("Found eligible Deluxe users", { count: deluxeUsers?.length || 0 });

      for (const sub of deluxeUsers || []) {
        // Check if we already sent this email
        const { data: existingSend } = await supabase
          .from('feedback_emails_sent')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('email_type', 'deluxe_14d')
          .maybeSingle();

        if (existingSend) {
          continue; // Already sent
        }

        // Get user email from auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(sub.user_id);
        
        if (userError || !userData.user?.email) {
          logStep("ERROR: Failed to get user email", { userId: sub.user_id });
          errors++;
          continue;
        }

        // Send the email
        const feedbackUrl = `${BASE_URL}/feedback?type=deluxe`;
        const success = await sendEmail(
          userData.user.email,
          "How's Deluxe treating you? ⭐",
          getDeluxeUserEmailHtml(feedbackUrl)
        );

        if (success) {
          // Record the send
          const { error: insertError } = await supabase
            .from('feedback_emails_sent')
            .insert({
              user_id: sub.user_id,
              email_type: 'deluxe_14d'
            });

          if (insertError) {
            logStep("ERROR: Failed to record email send", { userId: sub.user_id, error: insertError });
            errors++;
          } else {
            deluxeEmailsSent++;
          }
        } else {
          errors++;
        }

        // Rate limit: wait 600ms between emails
        await sleep(600);
      }
    }

    const summary = {
      freeEmailsSent,
      deluxeEmailsSent,
      totalSent: freeEmailsSent + deluxeEmailsSent,
      errors
    };

    logStep("Feedback email job completed", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    logStep("ERROR: Unexpected error in feedback email job", { error: error.message });
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
