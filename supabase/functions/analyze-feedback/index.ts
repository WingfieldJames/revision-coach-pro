import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Get all products that have feedback
    const { data: productsWithFeedback } = await supabaseAdmin.rpc('get_products_with_feedback');

    // Fallback: manually query if RPC doesn't exist
    let productIds: string[] = [];
    if (productsWithFeedback) {
      productIds = productsWithFeedback.map((p: any) => p.product_id);
    } else {
      // Get product IDs from conversations that have feedback
      const { data } = await supabaseAdmin
        .from('message_feedback')
        .select('message_id');

      if (!data || data.length === 0) {
        return new Response(JSON.stringify({ message: "No feedback to analyze" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const messageIds = data.map((f: any) => f.message_id);
      const { data: messages } = await supabaseAdmin
        .from('chat_messages')
        .select('conversation_id')
        .in('id', messageIds);

      if (messages) {
        const convIds = [...new Set(messages.map((m: any) => m.conversation_id))];
        const { data: convs } = await supabaseAdmin
          .from('chat_conversations')
          .select('product_id')
          .in('id', convIds);
        if (convs) {
          productIds = [...new Set(convs.map((c: any) => c.product_id).filter(Boolean))] as string[];
        }
      }
    }

    if (productIds.length === 0) {
      return new Response(JSON.stringify({ message: "No feedback to analyze" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, string> = {};

    for (const productId of productIds) {
      // Fetch thumbs-down feedback with message content and the user's question
      const { data: negativeFeedback } = await supabaseAdmin
        .from('message_feedback')
        .select(`
          feedback_type,
          feedback_text,
          message_id
        `)
        .eq('feedback_type', 'thumbs_down')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!negativeFeedback || negativeFeedback.length === 0) continue;

      // Get the actual message content for negative feedback
      const negMsgIds = negativeFeedback.map((f: any) => f.message_id);
      const { data: negMessages } = await supabaseAdmin
        .from('chat_messages')
        .select('id, content, conversation_id')
        .in('id', negMsgIds);

      if (!negMessages || negMessages.length === 0) continue;

      // Filter to only messages from this product's conversations
      const convIds = [...new Set(negMessages.map((m: any) => m.conversation_id))];
      const { data: convs } = await supabaseAdmin
        .from('chat_conversations')
        .select('id')
        .in('id', convIds)
        .eq('product_id', productId);

      if (!convs || convs.length === 0) continue;

      const validConvIds = new Set(convs.map((c: any) => c.id));
      const productMessages = negMessages.filter((m: any) => validConvIds.has(m.conversation_id));

      if (productMessages.length === 0) continue;

      // For each negative message, get the user question that preceded it
      const pairs: Array<{ question: string; answer: string; feedback_text?: string }> = [];
      for (const msg of productMessages.slice(0, 30)) {
        const { data: convMessages } = await supabaseAdmin
          .from('chat_messages')
          .select('role, content')
          .eq('conversation_id', msg.conversation_id)
          .order('created_at', { ascending: true });

        if (!convMessages) continue;

        // Find the user message right before this assistant message
        for (let i = 1; i < convMessages.length; i++) {
          if (convMessages[i].content === msg.content && convMessages[i].role === 'assistant') {
            const feedback = negativeFeedback.find((f: any) => f.message_id === msg.id);
            pairs.push({
              question: convMessages[i - 1].content.slice(0, 500),
              answer: msg.content.slice(0, 800),
              feedback_text: feedback?.feedback_text || undefined,
            });
            break;
          }
        }
      }

      if (pairs.length === 0) continue;

      // Also get thumbs-up count for context
      const { count: positiveCount } = await supabaseAdmin
        .from('message_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('feedback_type', 'thumbs_up');

      // Use LLM to analyze patterns and generate guidelines
      const analysisPrompt = `You are analyzing student feedback on an AI tutoring chatbot. Below are ${pairs.length} question-answer pairs that received NEGATIVE feedback (thumbs down) from students.

Positive feedback count: ${positiveCount || 0}
Negative feedback count: ${pairs.length}

NEGATIVELY-RATED RESPONSES:
${pairs.map((p, i) => `
--- Example ${i + 1} ---
Student asked: ${p.question}
AI responded: ${p.answer}
${p.feedback_text ? `Student comment: ${p.feedback_text}` : ''}
`).join('\n')}

Analyze these responses and identify specific patterns in WHY students disliked them. Then generate a concise set of improvement guidelines (max 500 words) that should be injected into the AI's system prompt to fix these issues.

Format your response as a single block of text that can be directly appended to a system prompt. Start with "Based on student feedback, follow these guidelines:" and list specific, actionable rules. Focus on:
- Common mistakes in explanations
- Tone or style issues
- Missing information patterns
- Incorrect or unhelpful response structures

Do NOT include generic advice. Only include specific guidelines derived from the actual feedback patterns above.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: analysisPrompt }],
          stream: false,
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI analysis failed for product ${productId}: ${aiResponse.status}`);
        continue;
      }

      const aiData = await aiResponse.json();
      const guidelines = aiData.choices?.[0]?.message?.content;

      if (!guidelines) continue;

      // Upsert into prompt_improvements
      await supabaseAdmin
        .from('prompt_improvements')
        .upsert({
          product_id: productId,
          guidelines,
          feedback_count: pairs.length,
        }, { onConflict: 'product_id' });

      results[productId] = `Analyzed ${pairs.length} negative responses, generated guidelines`;
      console.log(`Updated prompt improvements for product ${productId} (${pairs.length} negative responses analyzed)`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-feedback:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
