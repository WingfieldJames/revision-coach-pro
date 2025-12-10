import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Available diagrams with their keywords for AI matching
const availableDiagrams = [
  {
    id: 'ad-as-basic',
    title: 'Aggregate Demand and Aggregate Supply',
    keywords: ['AD', 'AS', 'aggregate demand', 'aggregate supply', 'macroeconomic equilibrium', 'price level', 'real GDP', 'LRAS', 'SRAS']
  },
  {
    id: 'perfect-competition',
    title: 'Perfect Competition',
    keywords: ['perfect competition', 'perfectly competitive', 'price taker', 'MC=MR', 'normal profit', 'supernormal profit', 'long run equilibrium']
  },
  {
    id: 'demand-shift-left',
    title: 'Demand Shifting Left',
    keywords: ['demand decrease', 'demand shift left', 'fall in demand', 'demand curve shift', 'leftward shift demand', 'decrease in quantity demanded']
  },
  {
    id: 'kuznets-curve',
    title: 'Kuznets Curve',
    keywords: ['kuznets', 'inequality', 'income inequality', 'economic development', 'inverted U', 'simon kuznets']
  },
  {
    id: 'supply-demand-equilibrium',
    title: 'Supply and Demand Equilibrium',
    keywords: ['supply', 'demand', 'equilibrium', 'market equilibrium', 'price equilibrium', 'quantity equilibrium', 'market clearing']
  },
  {
    id: 'monopoly',
    title: 'Monopoly Price and Output',
    keywords: ['monopoly', 'monopolist', 'price maker', 'MR=MC', 'supernormal profit', 'deadweight loss', 'allocative inefficiency']
  },
  {
    id: 'supply-shift-right',
    title: 'Supply Shifting Right',
    keywords: ['supply increase', 'supply shift right', 'rise in supply', 'supply curve shift', 'rightward shift supply']
  },
  {
    id: 'phillips-curve',
    title: 'Phillips Curve',
    keywords: ['phillips curve', 'inflation', 'unemployment', 'trade-off', 'stagflation', 'NAIRU']
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create prompt for AI to match the diagram
    const diagramList = availableDiagrams.map(d => 
      `- ID: "${d.id}" | Title: "${d.title}" | Keywords: ${d.keywords.join(', ')}`
    ).join('\n');

    const systemPrompt = `You are an economics diagram matcher. Given a user's question or topic text, determine which economics diagram would be most appropriate to illustrate the concept.

Available diagrams:
${diagramList}

Rules:
1. Analyze the user's text to understand what economics concept is being discussed
2. Return ONLY a JSON object with the matching diagram ID
3. If no diagram matches well, return null for diagramId
4. Be generous in matching - if the text relates to any of the diagram topics, match it

Response format (JSON only, no explanation):
{"diagramId": "diagram-id-here"} or {"diagramId": null}`;

    console.log('Sending request to Lovable AI for diagram matching...');

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
    
    console.log('AI response:', content);

    // Parse the AI response
    let diagramId = null;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        diagramId = parsed.diagramId;
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Validate that the diagram ID exists
    if (diagramId && !availableDiagrams.find(d => d.id === diagramId)) {
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
