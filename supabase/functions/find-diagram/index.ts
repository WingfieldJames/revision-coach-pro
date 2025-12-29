import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Available diagrams with their keywords for AI matching
const availableDiagrams = [
  {
    id: 'ppf',
    title: 'Production Possibility Frontier (PPF)',
    keywords: ['PPF', 'production possibility frontier', 'production possibilities curve', 'PPC', 'opportunity cost', 'trade-off', 'scarcity', 'capital goods', 'consumer goods', 'economic efficiency', 'productive efficiency']
  },
  {
    id: 'ppf-shift',
    title: 'Shift of PPF',
    keywords: ['PPF shift', 'production possibility frontier shift', 'economic growth', 'outward shift', 'inward shift', 'increase in productive capacity', 'technological progress', 'capital accumulation']
  },
  {
    id: 'supply-demand-equilibrium',
    title: 'Supply and Demand Equilibrium',
    keywords: ['supply', 'demand', 'equilibrium', 'market equilibrium', 'price equilibrium', 'quantity equilibrium', 'market clearing', 'Pe', 'Qe', 'equilibrium price', 'equilibrium quantity']
  },
  {
    id: 'demand-shift-right',
    title: 'Demand Shifts Right (Increase in Demand)',
    keywords: ['demand increase', 'demand shift right', 'rise in demand', 'demand curve shift right', 'rightward shift demand', 'increase in quantity demanded', 'higher demand', 'D1 to D2']
  },
  {
    id: 'demand-shift-left',
    title: 'Demand Shifts Left (Decrease in Demand)',
    keywords: ['demand decrease', 'demand shift left', 'fall in demand', 'demand curve shift left', 'leftward shift demand', 'decrease in quantity demanded', 'lower demand', 'D2 to D1']
  },
  {
    id: 'supply-shift-right',
    title: 'Supply Shifts Right (Increase in Supply)',
    keywords: ['supply increase', 'supply shift right', 'rise in supply', 'supply curve shift right', 'rightward shift supply', 'increase in quantity supplied', 'higher supply', 'S1 to S2']
  },
  {
    id: 'supply-shift-left',
    title: 'Supply Shifts Left (Decrease in Supply)',
    keywords: ['supply decrease', 'supply shift left', 'fall in supply', 'supply curve shift left', 'leftward shift supply', 'decrease in quantity supplied', 'lower supply', 'S2 to S1']
  },
  {
    id: 'producer-consumer-surplus',
    title: 'Producer and Consumer Surplus',
    keywords: ['producer surplus', 'consumer surplus', 'welfare', 'economic welfare', 'total surplus', 'market surplus', 'surplus triangle', 'deadweight loss', 'allocative efficiency']
  },
  {
    id: 'specific-tax',
    title: 'Specific Tax (Per Unit Tax)',
    keywords: ['specific tax', 'per unit tax', 'indirect tax', 'tax incidence', 'consumer incidence', 'producer incidence', 'tax burden', 'excise tax', 'unit tax']
  },
  {
    id: 'ad-valorem-tax',
    title: 'Ad-Valorem Tax',
    keywords: ['ad valorem tax', 'percentage tax', 'VAT', 'value added tax', 'proportional tax', 'tax on value', 'government revenue', 'pivoting supply curve']
  },
  {
    id: 'subsidy',
    title: 'Subsidy',
    keywords: ['subsidy', 'government subsidy', 'producer benefit', 'consumer benefit', 'cost to government', 'subsidy diagram', 'supply shift subsidy', 'government spending']
  },
  {
    id: 'minimum-price',
    title: 'Minimum Price (Price Floor)',
    keywords: ['minimum price', 'price floor', 'excess supply', 'surplus', 'guaranteed minimum price', 'buffer stock', 'agricultural support', 'Pmin', 'price support']
  },
  {
    id: 'maximum-price',
    title: 'Maximum Price (Price Ceiling)',
    keywords: ['maximum price', 'price ceiling', 'excess demand', 'shortage', 'price cap', 'rent control', 'Pmax', 'price control', 'rationing']
  },
  {
    id: 'negative-externality-production',
    title: 'Negative Externality of Production',
    keywords: ['negative externality', 'externality of production', 'MSC', 'MPC', 'marginal social cost', 'marginal private cost', 'pollution', 'market failure', 'welfare loss', 'overproduction', 'deadweight loss']
  },
  {
    id: 'positive-externality-consumption',
    title: 'Positive Externality of Consumption',
    keywords: ['positive externality', 'externality of consumption', 'MSB', 'MPB', 'marginal social benefit', 'marginal private benefit', 'merit good', 'underconsumption', 'welfare gain', 'education', 'healthcare']
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.log("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

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

    console.log('Sending request to Lovable AI for diagram matching, user:', user.id);

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
