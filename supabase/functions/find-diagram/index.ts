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
  },
  {
    id: 'ad-sras-ad-shifts-right',
    title: 'AD-SRAS (AD Shifts Right)',
    keywords: ['AD shifts right', 'aggregate demand increase', 'AD increase', 'rightward shift AD', 'expansionary', 'fiscal policy', 'monetary policy', 'consumption increase', 'investment increase', 'government spending increase', 'exports increase', 'AD1 to AD2', 'SRAS AD model']
  },
  {
    id: 'demand-pull-inflation',
    title: 'Demand Pull Inflation',
    keywords: ['demand pull inflation', 'demand-pull', 'inflation caused by demand', 'excess demand', 'AD increase inflation', 'too much money chasing too few goods', 'overheating economy', 'inflationary gap', 'price level increase demand']
  },
  {
    id: 'ad-sras-ad-shifts-left',
    title: 'AD-SRAS (AD Shifts Left)',
    keywords: ['AD shifts left', 'aggregate demand decrease', 'AD decrease', 'leftward shift AD', 'contractionary', 'recession', 'consumption fall', 'investment fall', 'government spending cut', 'exports fall', 'AD2 to AD1', 'deflationary']
  },
  {
    id: 'ad-sras-sras-shifts-right',
    title: 'AD-SRAS (SRAS Shifts Right)',
    keywords: ['SRAS shifts right', 'short run aggregate supply increase', 'SRAS increase', 'rightward shift SRAS', 'lower production costs', 'productivity increase', 'wage decrease', 'raw material cost decrease', 'SRAS1 to SRAS2', 'supply side improvement']
  },
  {
    id: 'ad-sras-sras-shifts-left',
    title: 'AD-SRAS (SRAS Shifts Left)',
    keywords: ['SRAS shifts left', 'short run aggregate supply decrease', 'SRAS decrease', 'leftward shift SRAS', 'higher production costs', 'wage increase', 'raw material cost increase', 'oil price shock', 'supply shock', 'SRAS2 to SRAS1']
  },
  {
    id: 'cost-push-inflation',
    title: 'Cost Push Inflation',
    keywords: ['cost push inflation', 'cost-push', 'inflation caused by supply', 'supply side inflation', 'SRAS decrease inflation', 'wage push inflation', 'oil price inflation', 'raw material costs', 'stagflation', 'price level increase supply']
  },
  {
    id: 'circular-flow-of-income',
    title: 'Circular Flow of Income',
    keywords: ['circular flow', 'circular flow of income', 'households', 'firms', 'factor market', 'goods market', 'injections', 'withdrawals', 'leakages', 'savings', 'taxation', 'imports', 'investment', 'government spending', 'exports', 'national income']
  },
  {
    id: 'keynesian-lras',
    title: 'Keynesian Long Run AS',
    keywords: ['Keynesian', 'Keynesian LRAS', 'Keynesian long run aggregate supply', 'L-shaped AS', 'horizontal AS', 'spare capacity', 'unemployment', 'full employment', 'classical vs keynesian', 'backward bending AS']
  },
  {
    id: 'classical-positive-output-gap',
    title: 'Classical Positive Output Gap',
    keywords: ['positive output gap', 'inflationary gap', 'actual GDP above potential', 'overheating', 'above full employment', 'classical LRAS', 'Y greater than Yfe', 'boom', 'excess demand economy']
  },
  {
    id: 'classical-negative-output-gap',
    title: 'Classical Negative Output Gap',
    keywords: ['negative output gap', 'deflationary gap', 'recessionary gap', 'actual GDP below potential', 'below full employment', 'classical LRAS', 'Y less than Yfe', 'recession', 'spare capacity', 'unemployment gap']
  },
  {
    id: 'keynesian-negative-output-gap',
    title: 'Keynesian Negative Output Gap',
    keywords: ['keynesian negative output gap', 'keynesian deflationary gap', 'keynesian recessionary gap', 'keynesian below full employment', 'spare capacity keynesian', 'Y1 below Yfe keynesian', 'unemployment keynesian model']
  },
  {
    id: 'keynesian-economic-growth',
    title: 'Keynesian Economic Growth (LRAS Shifts Right)',
    keywords: ['keynesian economic growth', 'keynesian LRAS shift right', 'long run growth keynesian', 'potential output increase keynesian', 'productive capacity keynesian', 'LRAS1 to LRAS2 keynesian', 'supply side policies keynesian']
  },
  {
    id: 'trade-cycle',
    title: 'Trade Cycle (Business Cycle)',
    keywords: ['trade cycle', 'business cycle', 'economic cycle', 'boom', 'recession', 'slump', 'recovery', 'expansion', 'contraction', 'peak', 'trough', 'trend growth', 'actual growth', 'GDP fluctuations', 'cyclical fluctuations']
  },
  {
    id: 'short-run-phillips-curve',
    title: 'Short Run Phillips Curve',
    keywords: ['phillips curve', 'short run phillips curve', 'SRPC', 'inflation unemployment trade-off', 'inverse relationship inflation unemployment', 'demand side policies phillips', 'expectations augmented', 'natural rate of unemployment']
  },
  {
    id: 'profit-maximisation',
    title: 'Profit Maximisation',
    keywords: ['profit maximisation', 'profit maximization', 'MC=MR', 'marginal cost equals marginal revenue', 'supernormal profit', 'abnormal profit', 'profit max point', 'AR', 'AC', 'MC', 'MR', 'firm objective', 'monopoly profit']
  },
  {
    id: 'revenue-maximisation',
    title: 'Revenue Maximisation',
    keywords: ['revenue maximisation', 'revenue maximization', 'MR=0', 'marginal revenue equals zero', 'total revenue maximisation', 'Baumol', 'sales revenue', 'firm objective', 'managerial objective']
  },
  {
    id: 'sales-maximisation',
    title: 'Sales Maximisation',
    keywords: ['sales maximisation', 'sales maximization', 'AR=AC', 'average revenue equals average cost', 'normal profit constraint', 'Baumol', 'output maximisation', 'firm objective', 'managerial theories']
  },
  {
    id: 'mp-ap-diminishing-returns',
    title: 'MP and AP (Diminishing Returns)',
    keywords: ['marginal product', 'average product', 'MP', 'AP', 'diminishing returns', 'law of diminishing returns', 'diminishing marginal returns', 'variable factor', 'labour productivity', 'short run production']
  },
  {
    id: 'ac-avc-mc',
    title: 'AC, AVC and MC',
    keywords: ['average cost', 'average variable cost', 'marginal cost', 'AC', 'AVC', 'MC', 'AFC', 'average fixed cost', 'cost curves', 'U-shaped cost curves', 'short run costs', 'diminishing returns cost']
  },
  {
    id: 'internal-economies-of-scale',
    title: 'Internal Economies of Scale',
    keywords: ['internal economies of scale', 'LRAC', 'long run average cost', 'economies of scale', 'falling LRAC', 'minimum efficient scale', 'MES', 'diseconomies of scale', 'technical economies', 'financial economies', 'managerial economies']
  },
  {
    id: 'external-economies-of-scale',
    title: 'External Economies of Scale',
    keywords: ['external economies of scale', 'LRAC shift down', 'long run average cost shift', 'industry growth', 'agglomeration', 'clustering', 'infrastructure', 'skilled labour pool']
  },
  {
    id: 'short-run-shut-down',
    title: 'Short Run Shut Down Point',
    keywords: ['short run shut down', 'shut down point', 'P below AVC', 'price below average variable cost', 'loss minimisation', 'continue or shut down', 'covering variable costs', 'making a loss']
  },
  {
    id: 'long-run-shut-down',
    title: 'Long Run Shut Down Point',
    keywords: ['long run shut down', 'exit point', 'P below AC', 'price below average cost', 'subnormal profit', 'leaving the industry', 'long run losses', 'exit the market']
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
