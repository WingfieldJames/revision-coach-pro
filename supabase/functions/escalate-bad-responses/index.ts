import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find messages with 3+ thumbs_down from different users
    const { data: badMessages, error: queryError } = await supabase.rpc(
      "get_bad_messages_for_escalation"
    );

    // If the RPC doesn't exist, fall back to a manual query approach
    let candidates: { message_id: string; thumbs_down_count: number }[] = [];

    if (queryError) {
      // Manual approach: fetch all thumbs_down feedback grouped by message
      const { data: feedback, error: feedbackError } = await supabase
        .from("message_feedback")
        .select("message_id, user_id")
        .eq("feedback_type", "thumbs_down");

      if (feedbackError) {
        throw new Error(
          `Failed to fetch feedback: ${feedbackError.message}`
        );
      }

      // Group by message_id, count distinct user_ids
      const messageCounts = new Map<string, Set<string>>();
      for (const row of feedback ?? []) {
        if (!messageCounts.has(row.message_id)) {
          messageCounts.set(row.message_id, new Set());
        }
        messageCounts.get(row.message_id)!.add(row.user_id);
      }

      for (const [messageId, users] of messageCounts) {
        if (users.size >= 3) {
          candidates.push({
            message_id: messageId,
            thumbs_down_count: users.size,
          });
        }
      }
    } else {
      candidates = (badMessages ?? []).map(
        (r: { message_id: string; cnt: number }) => ({
          message_id: r.message_id,
          thumbs_down_count: r.cnt,
        })
      );
    }

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ flagged: [], message: "No new messages to flag" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exclude messages already flagged
    const candidateIds = candidates.map((c) => c.message_id);
    const { data: alreadyFlagged, error: flaggedError } = await supabase
      .from("flagged_responses")
      .select("message_id")
      .in("message_id", candidateIds);

    if (flaggedError) {
      throw new Error(
        `Failed to check flagged_responses: ${flaggedError.message}`
      );
    }

    const alreadyFlaggedIds = new Set(
      (alreadyFlagged ?? []).map((r: { message_id: string }) => r.message_id)
    );

    const newCandidates = candidates.filter(
      (c) => !alreadyFlaggedIds.has(c.message_id)
    );

    if (newCandidates.length === 0) {
      return new Response(
        JSON.stringify({
          flagged: [],
          message: "All bad messages already flagged",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full context for each newly flagged message
    const flaggedResponses = [];

    for (const candidate of newCandidates) {
      // Get the AI message and its conversation
      const { data: aiMessage, error: msgError } = await supabase
        .from("chat_messages")
        .select("id, conversation_id, content, created_at")
        .eq("id", candidate.message_id)
        .single();

      if (msgError || !aiMessage) continue;

      // Get the user question that preceded this AI response
      const { data: precedingMessages } = await supabase
        .from("chat_messages")
        .select("content, role")
        .eq("conversation_id", aiMessage.conversation_id)
        .eq("role", "user")
        .lt("created_at", aiMessage.created_at)
        .order("created_at", { ascending: false })
        .limit(1);

      const userQuestion =
        precedingMessages && precedingMessages.length > 0
          ? precedingMessages[0].content
          : null;

      // Get the product via the conversation
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("product_id")
        .eq("id", aiMessage.conversation_id)
        .single();

      const productId = conversation?.product_id ?? null;

      // Get product name for the response payload
      let productName: string | null = null;
      if (productId) {
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", productId)
          .single();
        productName = product?.name ?? null;
      }

      flaggedResponses.push({
        message_id: candidate.message_id,
        product_id: productId,
        user_question: userQuestion,
        ai_response: aiMessage.content,
        thumbs_down_count: candidate.thumbs_down_count,
        status: "pending",
        // extra field for the JSON response only
        _product_name: productName,
      });
    }

    // Insert into flagged_responses (exclude the _product_name helper field)
    const rowsToInsert = flaggedResponses.map(
      ({ _product_name, ...row }) => row
    );

    const { error: insertError } = await supabase
      .from("flagged_responses")
      .insert(rowsToInsert);

    if (insertError) {
      throw new Error(
        `Failed to insert flagged responses: ${insertError.message}`
      );
    }

    // Build a clean response payload
    const result = flaggedResponses.map((r) => ({
      message_id: r.message_id,
      product_name: r._product_name,
      user_question: r.user_question,
      ai_response: r.ai_response,
      thumbs_down_count: r.thumbs_down_count,
      status: r.status,
    }));

    return new Response(
      JSON.stringify({
        flagged: result,
        message: `Flagged ${result.length} new bad response(s)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
