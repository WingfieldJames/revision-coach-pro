import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmail =
      Deno.env.get("ADMIN_EMAIL") || "astarai.official@gmail.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toISOString();
    const periodStart = twentyFourHoursAgo;
    const periodEnd = now.toISOString();

    // --- 1. New signups ---
    const { count: newSignups } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart);

    // --- 2. New subscriptions / conversions ---
    const { data: newSubs } = await supabase
      .from("subscriptions")
      .select("status, payment_type")
      .gte("created_at", periodStart);

    const newSubscriptions = newSubs?.length ?? 0;
    const subscriptionBreakdown: Record<string, number> = {};
    (newSubs ?? []).forEach((sub: any) => {
      const key = `${sub.status}/${sub.payment_type ?? "unknown"}`;
      subscriptionBreakdown[key] = (subscriptionBreakdown[key] || 0) + 1;
    });

    // --- 3. Total conversations started ---
    const { count: conversationsStarted } = await supabase
      .from("chat_conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart);

    // --- 4. Total messages sent ---
    const { count: totalMessages } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart);

    // --- 5. Feedback counts ---
    const { count: thumbsUp } = await supabase
      .from("message_feedback")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart)
      .eq("feedback_type", "thumbs_up");

    const { count: thumbsDown } = await supabase
      .from("message_feedback")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart)
      .eq("feedback_type", "thumbs_down");

    // --- 6. Most active products by message count ---
    // Fetch conversations created or updated in the window, then count messages per product
    const { data: activeConversations } = await supabase
      .from("chat_conversations")
      .select("id, product_id")
      .gte("updated_at", periodStart);

    const conversationProductMap: Record<string, string> = {};
    (activeConversations ?? []).forEach((c: any) => {
      conversationProductMap[c.id] = c.product_id;
    });

    const conversationIds = Object.keys(conversationProductMap);
    const productMessageCounts: Record<string, number> = {};

    // Batch conversation IDs in groups to avoid overly large IN queries
    const BATCH_SIZE = 200;
    for (let i = 0; i < conversationIds.length; i += BATCH_SIZE) {
      const batch = conversationIds.slice(i, i + BATCH_SIZE);
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("conversation_id")
        .in("conversation_id", batch)
        .gte("created_at", periodStart);

      (messages ?? []).forEach((m: any) => {
        const productId = conversationProductMap[m.conversation_id];
        if (productId) {
          productMessageCounts[productId] =
            (productMessageCounts[productId] || 0) + 1;
        }
      });
    }

    // Resolve product names
    const productIds = Object.keys(productMessageCounts);
    let mostActiveProducts: { name: string; subject: string; messages: number }[] = [];

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, subject")
        .in("id", productIds);

      const productLookup: Record<string, { name: string; subject: string }> = {};
      (products ?? []).forEach((p: any) => {
        productLookup[p.id] = { name: p.name, subject: p.subject };
      });

      mostActiveProducts = productIds
        .map((id) => ({
          name: productLookup[id]?.name ?? "Unknown",
          subject: productLookup[id]?.subject ?? "Unknown",
          messages: productMessageCounts[id],
        }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 10);
    }

    // --- 7. Daily prompt usage count ---
    const { count: promptUsageCount } = await supabase
      .from("daily_prompt_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart);

    // --- Build digest ---
    const feedbackTotal = (thumbsUp ?? 0) + (thumbsDown ?? 0);
    const satisfactionRate =
      feedbackTotal > 0
        ? Math.round(((thumbsUp ?? 0) / feedbackTotal) * 100)
        : null;

    const digest = {
      period: {
        from: periodStart,
        to: periodEnd,
        label: "Last 24 hours",
      },
      signups: {
        new_users: newSignups ?? 0,
      },
      subscriptions: {
        new_total: newSubscriptions,
        breakdown: subscriptionBreakdown,
      },
      engagement: {
        conversations_started: conversationsStarted ?? 0,
        messages_sent: totalMessages ?? 0,
        prompt_usage: promptUsageCount ?? 0,
      },
      feedback: {
        thumbs_up: thumbsUp ?? 0,
        thumbs_down: thumbsDown ?? 0,
        total: feedbackTotal,
        satisfaction_rate_percent: satisfactionRate,
      },
      most_active_products: mostActiveProducts,
      admin_email: adminEmail,
    };

    // --- Log digest (email integration can be added later) ---
    console.log("=== Daily Usage Digest ===");
    console.log(JSON.stringify(digest, null, 2));

    // --- Attempt email via Resend if API key is configured ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;

    if (resendApiKey) {
      const plainText = formatDigestPlainText(digest);
      const htmlBody = formatDigestHtml(digest);

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Revision Coach Pro <digest@revisioncoachpro.com>",
            to: [adminEmail],
            subject: `Daily Digest - ${now.toISOString().substring(0, 10)}`,
            text: plainText,
            html: htmlBody,
          }),
        });

        if (emailRes.ok) {
          emailSent = true;
          console.log("Digest email sent successfully to", adminEmail);
        } else {
          const errBody = await emailRes.text();
          console.error("Failed to send digest email:", emailRes.status, errBody);
        }
      } catch (emailErr) {
        console.error("Error sending digest email:", emailErr);
      }
    } else {
      console.log(
        "RESEND_API_KEY not set - skipping email. Digest returned as JSON."
      );
    }

    return new Response(
      JSON.stringify({ digest, email_sent: emailSent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Daily digest error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// --- Formatting helpers ---

function formatDigestPlainText(digest: any): string {
  const lines = [
    `Revision Coach Pro - Daily Digest`,
    `Period: ${digest.period.from.substring(0, 16)} to ${digest.period.to.substring(0, 16)} UTC`,
    ``,
    `SIGNUPS`,
    `  New users: ${digest.signups.new_users}`,
    ``,
    `SUBSCRIPTIONS`,
    `  New: ${digest.subscriptions.new_total}`,
  ];

  for (const [key, count] of Object.entries(digest.subscriptions.breakdown)) {
    lines.push(`    ${key}: ${count}`);
  }

  lines.push(
    ``,
    `ENGAGEMENT`,
    `  Conversations started: ${digest.engagement.conversations_started}`,
    `  Messages sent: ${digest.engagement.messages_sent}`,
    `  Prompt usage: ${digest.engagement.prompt_usage}`,
    ``,
    `FEEDBACK`,
    `  Thumbs up: ${digest.feedback.thumbs_up}`,
    `  Thumbs down: ${digest.feedback.thumbs_down}`,
    digest.feedback.satisfaction_rate_percent !== null
      ? `  Satisfaction: ${digest.feedback.satisfaction_rate_percent}%`
      : `  Satisfaction: N/A (no feedback)`,
    ``,
    `MOST ACTIVE PRODUCTS`
  );

  if (digest.most_active_products.length === 0) {
    lines.push(`  (none)`);
  } else {
    digest.most_active_products.forEach(
      (p: any, i: number) => {
        lines.push(`  ${i + 1}. ${p.name} (${p.subject}) - ${p.messages} msgs`);
      }
    );
  }

  return lines.join("\n");
}

function formatDigestHtml(digest: any): string {
  const productRows = digest.most_active_products
    .map(
      (p: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.subject}</td><td>${p.messages}</td></tr>`
    )
    .join("");

  const subBreakdown = Object.entries(digest.subscriptions.breakdown)
    .map(([key, count]) => `<li>${key}: ${count}</li>`)
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Revision Coach Pro - Daily Digest</h2>
      <p style="color: #666; font-size: 14px;">
        ${digest.period.from.substring(0, 16)} to ${digest.period.to.substring(0, 16)} UTC
      </p>

      <h3 style="border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Signups</h3>
      <p style="font-size: 28px; font-weight: bold; margin: 4px 0;">${digest.signups.new_users}</p>

      <h3 style="border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Subscriptions</h3>
      <p style="font-size: 28px; font-weight: bold; margin: 4px 0;">${digest.subscriptions.new_total}</p>
      ${subBreakdown ? `<ul>${subBreakdown}</ul>` : ""}

      <h3 style="border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Engagement</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 8px;">Conversations started</td><td style="font-weight: bold;">${digest.engagement.conversations_started}</td></tr>
        <tr><td style="padding: 4px 8px;">Messages sent</td><td style="font-weight: bold;">${digest.engagement.messages_sent}</td></tr>
        <tr><td style="padding: 4px 8px;">Prompt usage</td><td style="font-weight: bold;">${digest.engagement.prompt_usage}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Feedback</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 8px;">Thumbs up</td><td style="font-weight: bold;">${digest.feedback.thumbs_up}</td></tr>
        <tr><td style="padding: 4px 8px;">Thumbs down</td><td style="font-weight: bold;">${digest.feedback.thumbs_down}</td></tr>
        <tr><td style="padding: 4px 8px;">Satisfaction</td><td style="font-weight: bold;">${digest.feedback.satisfaction_rate_percent !== null ? digest.feedback.satisfaction_rate_percent + "%" : "N/A"}</td></tr>
      </table>

      <h3 style="border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Most Active Products</h3>
      ${
        productRows
          ? `<table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background: #f5f5f5;"><th style="padding: 6px; text-align: left;">#</th><th style="padding: 6px; text-align: left;">Product</th><th style="padding: 6px; text-align: left;">Subject</th><th style="padding: 6px; text-align: left;">Messages</th></tr></thead>
              <tbody>${productRows}</tbody>
            </table>`
          : `<p style="color: #999;">No product activity in this period.</p>`
      }

      <hr style="margin-top: 24px; border: none; border-top: 1px solid #e0e0e0;" />
      <p style="color: #999; font-size: 12px;">Sent automatically by Revision Coach Pro</p>
    </div>
  `;
}
