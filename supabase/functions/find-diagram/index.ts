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

    const systemPrompt = `You are a diagram matcher. Given a user's question or topic text, determine which diagram would be most appropriate to illustrate the concept.

IMPORTANT disambiguation rules:
- If the question is about a SINGLE MARKET (micro): use individual supply/demand diagrams, NOT AD/SRAS
- If the question is about the WHOLE ECONOMY (macro): use AD/SRAS diagrams, NOT micro supply/demand
- "Demand-pull inflation" = AD shifts right (macro), NOT micro demand shift
- "Cost-push inflation" = SRAS shifts left (macro), NOT micro supply shift
- Distinguish between firm-level diagrams (profit max, cost curves) and market-level diagrams

Available diagrams:
${diagramList}

Rules:
1. Analyze the user's text to understand what concept is being discussed
2. Return ONLY a JSON object with the matching diagram ID
3. If no diagram matches well, return null for diagramId
4. Be generous in matching - if the text relates to any of the diagram topics, match it

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

    let diagramId = null;
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
