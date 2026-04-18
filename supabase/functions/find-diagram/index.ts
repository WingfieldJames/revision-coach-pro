import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, custom_diagrams } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ONLY use custom diagrams from Build portal — no hardcoded fallbacks
    if (!custom_diagrams || !Array.isArray(custom_diagrams) || custom_diagrams.length === 0) {
      console.log('No custom diagrams provided — returning null');
      return new Response(
        JSON.stringify({ diagramId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableDiagrams = custom_diagrams.map((d: any) => ({
      id: d.id,
      title: d.title,
      keywords: [d.title],
    }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const diagramList = availableDiagrams.map((d: any) => 
      `- ID: "${d.id}" | Title: "${d.title}"`
    ).join('\n');

    const systemPrompt = `You are a precise diagram matcher for A-Level Economics and other subjects. Given a student's question or topic text, determine which single diagram best illustrates the CORE concept. Return ONLY a JSON object.

PRECISION RULES — read carefully:
1. Match on the COMPLETE CONCEPT, never on partial word overlap.
2. EXTERNALITIES vs EXTERNAL COSTS/BENEFITS — these are DIFFERENT diagrams:
   - "Externalities", "negative externality", "positive externality", "market failure due to externalities" → match "Negative Externality of Production" or "Positive Externality of Consumption"
   - "External cost" or "external benefit" are NOT the same as externality diagrams — only use those if the student literally says "external cost" or "external benefit"
   - The word "external" appearing in a title does NOT mean it is about externalities
3. MICRO vs MACRO — never confuse them:
   - Individual markets, price changes, supply/demand shifts → use Supply and Demand / shift diagrams
   - Whole economy, national output, price level → use AD/SRAS diagrams
   - "Demand-pull inflation" → "Demand Pull Inflation" diagram (AD shifts right)
   - "Cost-push inflation" → "Cost Push Inflation" diagram (SRAS shifts left)
4. SPECIFIC CONCEPT MATCHING:
   - "Game theory" / "prisoner's dilemma" / "Nash equilibrium" → "Game Theory Payoff Matrix"
   - "PPF" / "opportunity cost" / "production possibility" → "Production Possibility Frontier (PPF)" or "Shift of PPF"
   - "Comparative advantage" / "trade" / "specialisation" → "Comparative Advantage"
   - "Tax" → distinguish between "Specific Tax (Per Unit Tax)" and "Ad-Valorem Tax" based on context
   - "Subsidy" → "Subsidy" diagram
   - "Price floor" / "minimum wage" / "minimum price" → "Minimum Price (Price Floor)"
   - "Price ceiling" / "rent control" / "maximum price" → "Maximum Price (Price Ceiling)"
   - "Profit maximisation" / "MC=MR" → "Profit Maximisation"
   - "Revenue maximisation" / "MR=0" → "Revenue Maximisation"
   - "Sales maximisation" / "AC=AR" → "Sales Maximisation"
   - "Economies of scale" → distinguish between "Internal Economies of Scale" and "External Economies of Scale"
   - "Phillips curve" → "Short Run Phillips Curve"
   - "Lorenz curve" / "inequality" / "Gini" → "Lorenz Curve"
   - "Laffer curve" / "tax revenue" → "Laffer Curve"
   - "Perfect competition" → pick the most relevant perfect competition diagram
   - "Price discrimination" → "Price Discrimination"
   - "Tariff" / "import duty" → "Tariff"
   - "Business cycle" / "trade cycle" / "boom and bust" → "Trade Cycle (Business Cycle)"
   - "Circular flow" → "Circular Flow of Income"
   - "Diminishing returns" / "marginal product" → "MP and AP (Diminishing Returns)"
   - "Shut down" → "Short Run Shut Down Point" or "Long Run Shut Down Point" based on context
5. Be generous — if the topic relates to any diagram, match it.
6. If genuinely no diagram fits, return null.

Available diagrams:
${diagramList}

Response format (JSON only, no explanation):
{"diagramId": "diagram-id-here"} or {"diagramId": null}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze text' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Log AI usage
    try {
      const inputTok = data.usage?.prompt_tokens || 0;
      const outputTok = data.usage?.completion_tokens || 0;
      const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      await adminClient.from("api_usage_logs").insert({
        user_id: user.id, feature: "diagram", model: "google/gemini-2.5-flash",
        input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
      });
    } catch (logErr) { console.error("usage log failed:", logErr); }

    let diagramId: string | null = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        diagramId = parsed.diagramId;
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Validate that the diagram ID exists in the provided custom diagrams
    if (diagramId && !availableDiagrams.find((d: any) => d.id === diagramId)) {
      console.warn('AI returned invalid diagram ID:', diagramId);
      diagramId = null;
    }

    return new Response(
      JSON.stringify({ diagramId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-diagram function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
