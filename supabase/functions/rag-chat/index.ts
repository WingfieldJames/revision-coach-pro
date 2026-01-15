import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embeddings using Lovable AI gateway
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { message, product_id, history = [] } = await req.json();

    if (!message) {
      throw new Error("message is required");
    }

    if (!product_id) {
      throw new Error("product_id is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..."`);

    // 1. Generate embedding for the query
    const queryEmbedding = await generateEmbedding(message, lovableApiKey);

    // 2. Search for relevant documents
    const { data: matches, error: searchError } = await supabase
      .rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_count: 6,
        filter_product_id: product_id,
      });

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error(`Search error: ${searchError.message}`);
    }

    console.log(`Found ${matches?.length || 0} relevant chunks`);

    // 3. Build context from matches
    const context = matches
      ?.map((m: { content: string; similarity: number }) => m.content)
      .join("\n\n---\n\n") || "";

    // 4. Create system prompt with context
    const systemPrompt = `You are an expert A-Level Physics tutor specializing in OCR exam preparation. 
You help students understand concepts, practice exam technique, and achieve A* grades.

Use the following context from past papers, mark schemes, and specifications to answer questions.
If the context doesn't contain relevant information, use your general knowledge but be clear about it.
Always explain your reasoning and provide exam tips where relevant.

CONTEXT:
${context}

Remember to:
- Reference specific mark scheme points when discussing answers
- Highlight common mistakes students make
- Provide step-by-step solutions for calculations
- Connect concepts to the OCR specification where relevant`;

    // 5. Call Lovable AI for response (streaming)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("RAG chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
