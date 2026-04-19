import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maximum characters of training data context to include in the prompt
const MAX_CONTEXT_CHARS = 25000;

// Model tiers — single Flash model for all chat, lite for utility
const MODELS = {
  fast: "google/gemini-2.5-flash",   // All chat, including essay marking
  utility: "google/gemini-2.0-flash-lite", // Search query generation only
};

// Hardcoded economics diagrams fallback (used when Build portal has no diagrams)
const ECONOMICS_DIAGRAMS_FALLBACK = [
  { id: 'ppf', title: 'Production Possibility Frontier (PPF)', imagePath: '/diagrams/ppf.jpg', keywords: ['PPF', 'production possibility frontier', 'PPC', 'opportunity cost'] },
  { id: 'ppf-shift', title: 'Shift of PPF', imagePath: '/diagrams/ppf-shift.jpg', keywords: ['PPF shift', 'economic growth', 'outward shift'] },
  { id: 'supply-demand-equilibrium', title: 'Supply and Demand Equilibrium', imagePath: '/diagrams/supply-demand-equilibrium.jpg', keywords: ['supply and demand', 'equilibrium', 'market equilibrium'] },
  { id: 'demand-shift-right', title: 'Demand Shifts Right (Increase in Demand)', imagePath: '/diagrams/demand-shift-right.jpg', keywords: ['increase in demand', 'demand shift right', 'rightward shift demand'] },
  { id: 'demand-shift-left', title: 'Demand Shifts Left (Decrease in Demand)', imagePath: '/diagrams/demand-shift-left.jpg', keywords: ['decrease in demand', 'demand shift left'] },
  { id: 'supply-shift-right', title: 'Supply Shifts Right (Increase in Supply)', imagePath: '/diagrams/supply-shift-right.jpg', keywords: ['increase in supply', 'supply shift right'] },
  { id: 'supply-shift-left', title: 'Supply Shifts Left (Decrease in Supply)', imagePath: '/diagrams/supply-shift-left.jpg', keywords: ['decrease in supply', 'supply shift left'] },
  { id: 'producer-consumer-surplus', title: 'Producer and Consumer Surplus', imagePath: '/diagrams/producer-consumer-surplus.jpg', keywords: ['consumer surplus', 'producer surplus', 'welfare'] },
  { id: 'specific-tax', title: 'Specific Tax (Per Unit Tax)', imagePath: '/diagrams/specific-tax.jpg', keywords: ['specific tax', 'per unit tax', 'indirect tax'] },
  { id: 'ad-valorem-tax', title: 'Ad-Valorem Tax', imagePath: '/diagrams/ad-valorem-tax.jpg', keywords: ['ad valorem', 'percentage tax'] },
  { id: 'subsidy', title: 'Subsidy', imagePath: '/diagrams/subsidy.jpg', keywords: ['subsidy', 'government subsidy'] },
  { id: 'minimum-price', title: 'Minimum Price (Price Floor)', imagePath: '/diagrams/minimum-price.jpg', keywords: ['minimum price', 'price floor', 'minimum wage'] },
  { id: 'maximum-price', title: 'Maximum Price (Price Ceiling)', imagePath: '/diagrams/maximum-price.jpg', keywords: ['maximum price', 'price ceiling', 'rent control'] },
  { id: 'negative-externality-production', title: 'Negative Externality of Production', imagePath: '/diagrams/negative-externality-production.jpg', keywords: ['negative externality', 'negative externality of production', 'external cost', 'MSC greater than MPC'] },
  { id: 'positive-externality-consumption', title: 'Positive Externality of Consumption', imagePath: '/diagrams/positive-externality-consumption.jpg', keywords: ['positive externality', 'positive externality of consumption', 'external benefit', 'MSB greater than MPB', 'merit good'] },
  { id: 'ad-sras-ad-shifts-right', title: 'AD-SRAS (AD Shifts Right)', imagePath: '/diagrams/ad-sras-ad-shifts-right.jpg', keywords: ['AD shift right', 'aggregate demand increase', 'expansionary'] },
  { id: 'demand-pull-inflation', title: 'Demand Pull Inflation', imagePath: '/diagrams/demand-pull-inflation.jpg', keywords: ['demand pull inflation', 'demand-pull'] },
  { id: 'ad-sras-ad-shifts-left', title: 'AD-SRAS (AD Shifts Left)', imagePath: '/diagrams/ad-sras-ad-shifts-left.jpg', keywords: ['AD shift left', 'aggregate demand decrease', 'contractionary'] },
  { id: 'ad-sras-sras-shifts-right', title: 'AD-SRAS (SRAS Shifts Right)', imagePath: '/diagrams/ad-sras-sras-shifts-right.jpg', keywords: ['SRAS shift right', 'supply side improvement'] },
  { id: 'ad-sras-sras-shifts-left', title: 'AD-SRAS (SRAS Shifts Left)', imagePath: '/diagrams/ad-sras-sras-shifts-left.jpg', keywords: ['SRAS shift left', 'cost push', 'supply shock'] },
  { id: 'cost-push-inflation', title: 'Cost Push Inflation', imagePath: '/diagrams/cost-push-inflation.jpg', keywords: ['cost push inflation', 'cost-push'] },
  { id: 'circular-flow-of-income', title: 'Circular Flow of Income', imagePath: '/diagrams/circular-flow-of-income.jpg', keywords: ['circular flow', 'injections', 'withdrawals', 'leakages'] },
  { id: 'keynesian-lras', title: 'Keynesian Long Run AS', imagePath: '/diagrams/keynesian-lras.jpg', keywords: ['keynesian LRAS', 'keynesian aggregate supply', 'horizontal section'] },
  { id: 'classical-positive-output-gap', title: 'Classical Positive Output Gap', imagePath: '/diagrams/classical-positive-output-gap.jpg', keywords: ['positive output gap', 'inflationary gap', 'overheating', 'boom'] },
  { id: 'classical-negative-output-gap', title: 'Classical Negative Output Gap', imagePath: '/diagrams/classical-negative-output-gap.jpg', keywords: ['negative output gap', 'deflationary gap', 'recessionary gap', 'recession', 'spare capacity'] },
  { id: 'keynesian-negative-output-gap', title: 'Keynesian Negative Output Gap', imagePath: '/diagrams/keynesian-negative-output-gap.jpg', keywords: ['keynesian negative output gap', 'keynesian spare capacity'] },
  { id: 'keynesian-economic-growth', title: 'Keynesian Economic Growth (LRAS Shifts Right)', imagePath: '/diagrams/keynesian-economic-growth.jpg', keywords: ['keynesian growth', 'LRAS shift right'] },
  { id: 'trade-cycle', title: 'Trade Cycle (Business Cycle)', imagePath: '/diagrams/trade-cycle.jpg', keywords: ['trade cycle', 'business cycle', 'boom', 'bust', 'recession', 'recovery', 'output gap'] },
  { id: 'short-run-phillips-curve', title: 'Short Run Phillips Curve', imagePath: '/diagrams/short-run-phillips-curve.jpg', keywords: ['phillips curve', 'inflation unemployment trade-off'] },
  { id: 'profit-maximisation', title: 'Profit Maximisation', imagePath: '/diagrams/profit-maximisation.jpg', keywords: ['profit maximisation', 'MC=MR', 'supernormal profit'] },
  { id: 'revenue-maximisation', title: 'Revenue Maximisation', imagePath: '/diagrams/revenue-maximisation.jpg', keywords: ['revenue maximisation', 'MR=0'] },
  { id: 'sales-maximisation', title: 'Sales Maximisation', imagePath: '/diagrams/sales-maximisation.jpg', keywords: ['sales maximisation', 'AC=AR', 'normal profit'] },
  { id: 'mp-ap-diminishing-returns', title: 'MP and AP (Diminishing Returns)', imagePath: '/diagrams/mp-ap-diminishing-returns.jpg', keywords: ['diminishing returns', 'marginal product', 'average product'] },
  { id: 'ac-avc-mc', title: 'AC, AVC and MC', imagePath: '/diagrams/ac-avc-mc.jpg', keywords: ['average cost', 'marginal cost', 'AVC', 'cost curves'] },
  { id: 'internal-economies-of-scale', title: 'Internal Economies of Scale', imagePath: '/diagrams/internal-economies-of-scale.jpg', keywords: ['internal economies of scale', 'LRAC falling'] },
  { id: 'external-economies-of-scale', title: 'External Economies of Scale', imagePath: '/diagrams/external-economies-of-scale.jpg', keywords: ['external economies of scale', 'industry growth'] },
  { id: 'short-run-shut-down', title: 'Short Run Shut Down Point', imagePath: '/diagrams/short-run-shut-down.jpg', keywords: ['shut down point', 'short run shut down', 'P below AVC'] },
  { id: 'long-run-shut-down', title: 'Long Run Shut Down Point', imagePath: '/diagrams/long-run-shut-down.jpg', keywords: ['long run shut down', 'P below AC'] },
  { id: 'allocative-efficiency', title: 'Allocative Efficiency', imagePath: '/diagrams/allocative-efficiency.jpg', keywords: ['allocative efficiency', 'P=MC'] },
  { id: 'productive-efficiency', title: 'Productive Efficiency', imagePath: '/diagrams/productive-efficiency.jpg', keywords: ['productive efficiency', 'minimum AC'] },
  { id: 'dynamic-efficiency', title: 'Dynamic Efficiency', imagePath: '/diagrams/dynamic-efficiency.jpg', keywords: ['dynamic efficiency', 'innovation', 'R&D'] },
  { id: 'perfect-competition-equilibrium', title: 'Perfect Competition Equilibrium', imagePath: '/diagrams/perfect-competition-equilibrium.jpg', keywords: ['perfect competition', 'price taker', 'normal profit long run'] },
  { id: 'perfect-competition-entry', title: 'Perfect Competition - Supernormal to Normal Profit (Entry)', imagePath: '/diagrams/perfect-competition-entry.jpg', keywords: ['perfect competition entry', 'supernormal profit eroded'] },
  { id: 'perfect-competition-exit', title: 'Perfect Competition - Subnormal to Normal Profit (Exit)', imagePath: '/diagrams/perfect-competition-exit.jpg', keywords: ['perfect competition exit', 'subnormal profit', 'firms leave'] },
  { id: 'price-discrimination', title: 'Price Discrimination', imagePath: '/diagrams/price-discrimination.jpg', keywords: ['price discrimination', 'different prices different markets'] },
];

// User preferences interface
interface UserPreferences {
  year: string;
  predicted_grade: string;
  target_grade: string;
  additional_info: string | null;
}

// Content type definitions for modular training data
// These are the valid content_type values in document_chunks.metadata
const CONTENT_TYPES = {
  SPECIFICATION: 'specification',
  PAPER_1: 'paper_1',
  PAPER_2: 'paper_2',
  PAPER_3: 'paper_3',
  MARK_SCHEME: 'mark_scheme',
  ESSAY_MARKING: 'essay_marking',
  ESSAY_WRITING: 'essay_writing',
  EXAM_TECHNIQUE: 'exam_technique',
  DIAGRAM_GUIDE: 'diagram_guide',
  CASE_STUDY: 'case_study',
} as const;

// All past-paper-related content types treated as a single pool
const PAST_PAPER_TYPES = ['paper_1', 'paper_2', 'paper_3', 'past_paper', 'past_paper_qp', 'past_paper_ms'];

// Year-based recency bonus for past paper scoring
function getRecencyBonus(metadata: Record<string, unknown>): number {
  const year = String(metadata?.year || '');
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) return 0;
  if (yearNum >= 2024) return 20;
  if (yearNum >= 2023) return 15;
  if (yearNum >= 2022) return 10;
  if (yearNum >= 2021) return 5;
  return 0;
}

// Find relevant diagram based on message content using AI-powered matching
// ONLY uses custom diagrams from Build portal — no hardcoded fallbacks
async function findRelevantDiagram(
  message: string, 
  customDiagrams?: Array<{ id: string; title: string; imagePath: string; keywords?: string[] }>,
  lovableApiKey?: string
): Promise<{ id: string; title: string; imagePath: string } | null> {
  // If no diagrams provided at all, return null
  if (!customDiagrams || customDiagrams.length === 0) {
    console.log('No diagrams available for this product — skipping diagram matching');
    return null;
  }
  
  // Build diagram set from Build portal only
  const diagrams: Array<{ id: string; title: string; imagePath: string; keywords: string[] }> = customDiagrams.map(d => {
    const titleWords = d.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const kws = d.keywords && d.keywords.length > 0 ? d.keywords : titleWords;
    return { id: d.id, title: d.title, imagePath: d.imagePath, keywords: kws };
  });

  // Use AI-powered matching for better accuracy
  if (lovableApiKey && diagrams.length > 0) {
    try {
      const diagramList = diagrams.map(d => 
        `- ID: "${d.id}" | Title: "${d.title}" | Keywords: ${d.keywords.join(', ')}`
      ).join('\n');

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELS.main,
          messages: [
            { role: 'system', content: `You are a precise diagram matcher for A-Level Economics and other subjects. Given a student's question, determine which single diagram best illustrates the CORE concept. Return ONLY a JSON object.

PRECISION RULES — read carefully:
1. Match on the COMPLETE CONCEPT, never on partial word overlap. The word "negative" does NOT mean "negative externality". The word "external" does NOT mean "externality". You must match the FULL economic concept.
2. EXTERNALITIES — ONLY match externality diagrams when the student explicitly asks about externalities, market failure from externalities, or external costs/benefits:
   - "Negative externality" / "positive externality" / "externalities" / "market failure due to externalities" → match externality diagrams
   - "Negative output gap" / "negative growth" / "negative multiplier" → these are NOT about externalities. "Negative" here describes something else entirely.
   - "External economies of scale" → NOT an externality diagram. Match economies of scale.
3. MICRO vs MACRO — never confuse them:
   - Individual markets, price changes, supply/demand shifts → use Supply and Demand / shift diagrams
   - Whole economy, national output, price level, GDP, recession, output gap → use AD/AS or macro diagrams
   - "Output gap" / "negative output gap" / "positive output gap" / "spare capacity" / "recession" → use AD/AS diagram showing actual vs potential output, or Trade Cycle diagram. NEVER use an externality diagram.
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
   - "Business cycle" / "trade cycle" / "boom and bust" / "output gap" → "Trade Cycle (Business Cycle)"
   - "Circular flow" → "Circular Flow of Income"
   - "Diminishing returns" / "marginal product" → "MP and AP (Diminishing Returns)"
   - "Shut down" → "Short Run Shut Down Point" or "Long Run Shut Down Point" based on context
5. When in doubt about the match, return null. A wrong diagram is worse than no diagram.
6. If genuinely no diagram fits the concept, return null.

Available diagrams:
${diagramList}

Response format (JSON only, no explanation):
{"diagramId": "diagram-id-here"} or {"diagramId": null}` },
            { role: 'user', content: message }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.diagramId) {
            const matched = diagrams.find(d => d.id === parsed.diagramId);
            if (matched) {
              console.log(`AI matched diagram: ${matched.title}`);
              return { id: matched.id, title: matched.title, imagePath: matched.imagePath };
            }
          }
        }
      }
    } catch (err) {
      console.error('AI diagram matching failed, falling back to keyword:', err);
    }
  }
  
  // Fallback: keyword-based matching
  const lowerMessage = message.toLowerCase();
  for (const diagram of diagrams) {
    for (const keyword of diagram.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return { id: diagram.id, title: diagram.title, imagePath: diagram.imagePath };
      }
    }
  }
  
  return null;
}

// Free tier daily prompt limit
const FREE_TIER_DAILY_LIMIT = 3;

// Fallback system prompts (used when DB prompts are not available)
const FALLBACK_PROMPTS: Record<string, string> = {
  "default": `You are an expert A-Level tutor. You help students understand concepts, practice exam technique, and achieve A* grades.

Remember to:
- Explain concepts clearly with real-world examples
- Highlight common mistakes students make
- Give exam tips and mark scheme points where relevant`,
};

// AQA Psychology product ID - used for spec version routing
const PSYCHOLOGY_PRODUCT_ID = 'c56bc6d6-5074-4e1f-8bf2-8e900ba928ec';

// Build personalized system prompt with user context - PREPENDED to start
function buildPersonalizedPrompt(basePrompt: string, prefs: UserPreferences | null, userMessage: string, productId?: string): string {
  if (!prefs) return basePrompt;
  
  // Build student context block to PREPEND to the start of the system prompt
  let studentContext = `--- STUDENT CONTEXT ---
- Year Group: ${prefs.year}
- Current Predicted Grade: ${prefs.predicted_grade}
- Target Grade: ${prefs.target_grade}
- Additional Context: ${prefs.additional_info || 'None provided'}

--- INSTRUCTIONS FOR PERSONALIZATION ---
The predicted grade is what the user is currently set to achieve whilst the target grade is the user's aim. Help bridge the gap between their predicted and target grades. Naturally mention the exact grades in your responses so they know the feature works.

Year-specific context:
- If Year 13: Their final A Level exams are this year. Focus on exam technique and past paper practice.
- If Year 12: They are only studying Theme 1 and 2 and have predicted grade exams. Include more foundational explanations.

Apply the additional context naturally depending on the user's question - do not bring this up constantly.
`;

  // Add Psychology-specific spec version context
  if (productId === PSYCHOLOGY_PRODUCT_ID) {
    if (prefs.year === 'Year 13') {
      studentContext += `\nSpecification context: You are sitting the 2016 specification (exams June 2026). Use the spec for 2026. This spec includes: Zimbardo, types of LTM, Wundt/introspection, biological rhythms, and 'Psychopathology' as the topic name.\n`;
    } else if (prefs.year === 'Year 12') {
      studentContext += `\nSpecification context: You are sitting the 2027 specification (exams June 2027 onwards). Use the spec 2027 onwards. Key differences: no Zimbardo, no types of LTM, no Wundt/introspection, no biological rhythms. 'Psychopathology' is renamed to 'Clinical Psychology and Mental Health'. Gender includes gender identities (non-binary, gender fluid). Forensic uses 'typology approach' and 'data-driven approach'.\n`;
    }
  }

  studentContext += `---\n\n`;

  // PREPEND student context to the START of the system prompt (not append to end)
  return studentContext + basePrompt;
}

// Fetch system prompt from database for a given product
// Always uses system_prompt_deluxe - unified model for all users
async function fetchSystemPrompt(
  supabase: ReturnType<typeof createClient>,
  productId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('system_prompt_deluxe, slug')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('Error fetching product prompt:', error);
      return FALLBACK_PROMPTS["default"];
    }
    
    const prompt = data?.system_prompt_deluxe;
    if (prompt) {
      console.log(`Using DB deluxe prompt for product: ${data.slug}`);
      return prompt;
    }
    
    // Fallback to default if no prompt in DB
    console.log(`No deluxe prompt in DB for ${data?.slug}, using fallback`);
    return FALLBACK_PROMPTS["default"];
  } catch (err) {
    console.error('Error in fetchSystemPrompt:', err);
    return FALLBACK_PROMPTS["default"];
  }
}

// Result type for document fetching
interface FetchContextResult {
  context: string;
  sourcesSearched: Array<{ type: string; topic: string }>;
}

// Detect content type priorities based on user message keywords
function detectContentTypePriorities(userMessage: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const priorities: string[] = [];
  
  // Exam technique keywords
  if (lowerMessage.includes('exam') || lowerMessage.includes('technique') || 
      lowerMessage.includes('how to answer') || lowerMessage.includes('marks') ||
      lowerMessage.includes('structure') || lowerMessage.includes('essay')) {
    priorities.push(CONTENT_TYPES.EXAM_TECHNIQUE, CONTENT_TYPES.ESSAY_WRITING, CONTENT_TYPES.MARK_SCHEME);
  }
  
  // Past paper / practice question keywords
  if (lowerMessage.includes('practice') || lowerMessage.includes('question') ||
      lowerMessage.includes('past paper') || lowerMessage.includes('example') ||
      lowerMessage.includes('find me') || lowerMessage.includes('give me') ||
      lowerMessage.includes('show me') || lowerMessage.includes('test me') ||
      lowerMessage.includes('quiz me') || lowerMessage.includes('past exam')) {
    priorities.push(...PAST_PAPER_TYPES);
  }
  
  // Definition / concept keywords
  if (lowerMessage.includes('define') || lowerMessage.includes('what is') ||
      lowerMessage.includes('explain') || lowerMessage.includes('meaning')) {
    priorities.push(CONTENT_TYPES.SPECIFICATION);
  }
  
  // Mark scheme keywords
  if (lowerMessage.includes('mark scheme') || lowerMessage.includes('marking') ||
      lowerMessage.includes('how many marks')) {
    priorities.push(CONTENT_TYPES.MARK_SCHEME);
  }
  
  // Default: specification is always useful
  if (!priorities.includes(CONTENT_TYPES.SPECIFICATION)) {
    priorities.push(CONTENT_TYPES.SPECIFICATION);
  }
  
  return priorities;
}

// Use AI to generate focused search queries for better retrieval
async function generateSearchQueries(
  lovableApiKey: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
): Promise<string[]> {
  try {
    const aiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const response = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS.utility,
        messages: [
          {
            role: "system",
            content: `You generate search queries for an A-Level revision knowledge base. Given a student's question, output exactly 3 short keyword-based search queries (2-5 words each) that would find the most relevant training data chunks. Output as a JSON array of strings. Focus on subject-specific terminology, topic names, and exam concepts. Consider the conversation context when generating queries.`,
          },
          // Include last 2 messages of history for context
          ...history.slice(-2),
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`Query planning failed (${response.status}), falling back to keyword search`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON array from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0]) as string[];
      console.log(`AI-generated search queries: ${JSON.stringify(queries)}`);
      return queries.slice(0, 3);
    }
    
    console.warn('Could not parse search queries from AI response, falling back');
    return [];
  } catch (err) {
    console.error('Error generating search queries:', err);
    return [];
  }
}

// Score a chunk by keyword relevance
function scoreChunkByKeywords(
  chunk: { content: string; metadata: Record<string, unknown> },
  keywords: string[]
): number {
  const text = (chunk.content + ' ' + JSON.stringify(chunk.metadata || {})).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const matches = text.split(kw).length - 1;
    score += matches;
  }
  return score;
}

// Query relevant document chunks from the training data
// Uses AI-generated search queries for targeted retrieval with context cap
async function fetchRelevantContext(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  userMessage: string,
  contentTypes: string[] | undefined,
  userPreferences: UserPreferences | null | undefined,
  searchQueries: string[],
): Promise<FetchContextResult> {
  try {
    // Detect content type priorities based on user message
    const effectiveContentTypes = contentTypes && contentTypes.length > 0 
      ? contentTypes 
      : detectContentTypePriorities(userMessage);
    
    console.log(`Content type priorities: ${effectiveContentTypes.join(', ')}`);
    
    // Fetch ALL chunks for this product (they're small enough to filter in memory)
    const { data: allChunks, error } = await supabase
      .from('document_chunks')
      .select('content, metadata')
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error fetching document chunks:', error);
      return { context: '', sourcesSearched: [] };
    }
    
    if (!allChunks || allChunks.length === 0) {
      console.log(`No training data found for product ${productId}`);
      return { context: '', sourcesSearched: [] };
    }
    
    // For Psychology product, filter specification chunks by spec_version based on user year
    let filteredChunks = allChunks;
    if (productId === PSYCHOLOGY_PRODUCT_ID && userPreferences) {
      const specVersion = userPreferences.year === 'Year 12' ? '2027' : '2026';
      console.log(`Psychology spec filtering: Year ${userPreferences.year} -> spec_version ${specVersion}`);
      
      filteredChunks = allChunks.filter((chunk: { content: string; metadata: Record<string, unknown> }) => {
        const metadata = chunk.metadata || {};
        if (metadata.content_type !== 'specification') return true;
        return metadata.spec_version === specVersion;
      });
      
      console.log(`Filtered from ${allChunks.length} to ${filteredChunks.length} chunks after spec_version filtering`);
    }
    
    // === TWO-STEP RETRIEVAL: Use AI-generated queries if available ===
    if (searchQueries.length > 0) {
      return retrieveWithAIQueries(filteredChunks, searchQueries, userMessage, effectiveContentTypes);
    }
    
    // === FALLBACK: Original keyword-based retrieval (capped) ===
    return retrieveWithKeywords(filteredChunks, userMessage, effectiveContentTypes);
  } catch (err) {
    console.error('Error in fetchRelevantContext:', err);
    return { context: '', sourcesSearched: [] };
  }
}

// Targeted retrieval using AI-generated search queries
function retrieveWithAIQueries(
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>,
  searchQueries: string[],
  userMessage: string,
  effectiveContentTypes: string[],
): FetchContextResult {
  const CHUNKS_PER_QUERY = 5;
  const selectedSet = new Set<number>(); // track by index to deduplicate
  const selectedChunks: Array<{ content: string; metadata: Record<string, unknown>; _relevance: number }> = [];
  
  // For each AI-generated query, find top chunks
  for (const query of searchQueries) {
    const queryKeywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    
    const scored = chunks.map((chunk, idx) => ({
      chunk,
      idx,
      score: scoreChunkByKeywords(chunk, queryKeywords) + getRecencyBonus(chunk.metadata as Record<string, unknown>),
    }))
    .filter(c => c.score > 0 && !selectedSet.has(c.idx))
    .sort((a, b) => b.score - a.score)
    .slice(0, CHUNKS_PER_QUERY);
    
    for (const item of scored) {
      selectedSet.add(item.idx);
      selectedChunks.push({ ...item.chunk, _relevance: item.score });
    }
  }
  
  // Also add a few from the original user message keywords to cover edge cases
  const userKeywords = userMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  const userScored = chunks.map((chunk, idx) => ({
    chunk,
    idx,
    score: scoreChunkByKeywords(chunk, userKeywords) + getRecencyBonus(chunk.metadata as Record<string, unknown>),
  }))
  .filter(c => c.score > 0 && !selectedSet.has(c.idx))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
  
  for (const item of userScored) {
    selectedSet.add(item.idx);
    selectedChunks.push({ ...item.chunk, _relevance: item.score });
  }
  
  // Sort all selected by relevance (highest first)
  selectedChunks.sort((a, b) => b._relevance - a._relevance);
  
  console.log(`AI-query retrieval: ${selectedChunks.length} chunks selected (${searchQueries.length} queries)`);
  
  // Build context with character cap
  return buildCappedContext(selectedChunks);
}

// Original keyword-based retrieval with character cap
function retrieveWithKeywords(
  filteredChunks: Array<{ content: string; metadata: Record<string, unknown> }>,
  userMessage: string,
  effectiveContentTypes: string[],
): FetchContextResult {
  const messageKeywords = userMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  
  // Score all chunks
  const scoredChunks = filteredChunks.map(chunk => ({
    ...chunk,
    _relevance: scoreChunkByKeywords(chunk, messageKeywords) + getRecencyBonus(chunk.metadata as Record<string, unknown>),
  }));
  
  // Group by content_type
  const chunksByType = new Map<string, typeof scoredChunks>();
  for (const chunk of scoredChunks) {
    const ct = (chunk.metadata as Record<string, unknown>)?.content_type as string || 'general';
    if (!chunksByType.has(ct)) chunksByType.set(ct, []);
    chunksByType.get(ct)!.push(chunk);
  }
  
  // Sort each type's chunks by relevance
  for (const [, chunks] of chunksByType) {
    chunks.sort((a, b) => b._relevance - a._relevance);
  }
  
  console.log(`Content types available: ${Array.from(chunksByType.entries()).map(([k, v]) => `${k}(${v.length})`).join(', ')}`);
  
  // Build balanced selection (max 50, but will be capped by chars later)
  const MAX_CHUNKS = 50;
  const selectedChunks: Array<{ content: string; metadata: Record<string, unknown>; _relevance: number }> = [];
  
  const isPastPaperSearch = effectiveContentTypes.some(t => PAST_PAPER_TYPES.includes(t));
  
  if (isPastPaperSearch) {
    const PAPER_SLOTS = Math.floor(MAX_CHUNKS * 0.75);
    const OTHER_SLOTS = MAX_CHUNKS - PAPER_SLOTS;
    
    const paperPool: Array<{ content: string; metadata: Record<string, unknown>; _relevance: number; _paperNum: string }> = [];
    for (const [ct, chunks] of chunksByType) {
      if (PAST_PAPER_TYPES.includes(ct)) {
        for (const chunk of chunks) {
          const paperNum = String(chunk.metadata?.paper_number || ct.replace('paper_', '').replace('past_paper_qp', 'qp').replace('past_paper_ms', 'ms').replace('past_paper', 'general'));
          paperPool.push({ ...chunk, _paperNum: paperNum });
        }
      }
    }
    
    const paperGroups = new Map<string, typeof paperPool>();
    for (const chunk of paperPool) {
      if (!paperGroups.has(chunk._paperNum)) paperGroups.set(chunk._paperNum, []);
      paperGroups.get(chunk._paperNum)!.push(chunk);
    }
    
    for (const [, group] of paperGroups) {
      group.sort((a, b) => b._relevance - a._relevance);
    }
    
    const numPaperGroups = paperGroups.size || 1;
    const slotsPerPaper = Math.floor(PAPER_SLOTS / numPaperGroups);
    const extraSlots = PAPER_SLOTS - (slotsPerPaper * numPaperGroups);
    
    let groupIndex = 0;
    for (const [, group] of paperGroups) {
      const bonus = groupIndex < extraSlots ? 1 : 0;
      const limit = Math.min(group.length, slotsPerPaper + bonus);
      selectedChunks.push(...group.slice(0, limit));
      groupIndex++;
    }
    
    const nonPaperTypes = Array.from(chunksByType.keys()).filter(t => !PAST_PAPER_TYPES.includes(t));
    const slotsPerOther = nonPaperTypes.length > 0 ? Math.floor(OTHER_SLOTS / nonPaperTypes.length) : 0;
    for (const ct of nonPaperTypes) {
      const chunks = chunksByType.get(ct)!;
      const limit = Math.min(chunks.length, slotsPerOther || OTHER_SLOTS);
      selectedChunks.push(...chunks.slice(0, limit));
    }
  } else {
    const prioritizedTypes = effectiveContentTypes.filter(t => chunksByType.has(t));
    const remainingTypes = Array.from(chunksByType.keys()).filter(t => !prioritizedTypes.includes(t));
    
    const prioritySlots = prioritizedTypes.length > 0 
      ? Math.floor(MAX_CHUNKS * 0.6 / prioritizedTypes.length) 
      : 0;
    const remainingSlots = remainingTypes.length > 0 
      ? Math.floor(MAX_CHUNKS * 0.4 / remainingTypes.length) 
      : Math.floor(MAX_CHUNKS / Math.max(prioritizedTypes.length, 1));
    
    for (const ct of prioritizedTypes) {
      const chunks = chunksByType.get(ct)!;
      const limit = Math.min(chunks.length, prioritySlots || Math.floor(MAX_CHUNKS / chunksByType.size));
      selectedChunks.push(...chunks.slice(0, limit));
    }
    
    for (const ct of remainingTypes) {
      const chunks = chunksByType.get(ct)!;
      const limit = Math.min(chunks.length, remainingSlots);
      selectedChunks.push(...chunks.slice(0, limit));
    }
  }
  
  // Sort by relevance for capping (highest relevance first)
  selectedChunks.sort((a, b) => b._relevance - a._relevance);
  
  console.log(`Selected ${selectedChunks.length} balanced chunks from ${filteredChunks.length} total`);
  
  return buildCappedContext(selectedChunks);
}

// Build context string with MAX_CONTEXT_CHARS cap
function buildCappedContext(
  selectedChunks: Array<{ content: string; metadata: Record<string, unknown> }>,
): FetchContextResult {
  const sourcesMap = new Map<string, { type: string; topic: string }>();
  const contextParts: string[] = [];
  let totalChars = 0;
  let includedCount = 0;
  
  for (const chunk of selectedChunks) {
    const contentType = chunk.metadata?.content_type || 'general';
    const topic = chunk.metadata?.topic || '';
    const header = topic 
      ? `[${String(contentType).toUpperCase()} - ${topic}]` 
      : `[${String(contentType).toUpperCase()}]`;
    
    const part = `${header}\n${chunk.content}`;
    
    // Check if adding this chunk would exceed the cap
    if (totalChars + part.length > MAX_CONTEXT_CHARS && contextParts.length > 0) {
      break; // Stop adding chunks
    }
    
    contextParts.push(part);
    totalChars += part.length;
    includedCount++;
    
    const sourceKey = `${contentType}-${topic}`;
    if (!sourcesMap.has(sourceKey)) {
      sourcesMap.set(sourceKey, { type: String(contentType), topic: String(topic) });
    }
  }
  
  console.log(`Context capped: ${includedCount} chunks, ${totalChars} chars (max ${MAX_CONTEXT_CHARS})`);
  
  return {
    context: contextParts.join('\n\n---\n\n'),
    sourcesSearched: Array.from(sourcesMap.values()),
  };
}

// Check and increment daily usage for free tier users
async function checkAndIncrementUsage(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  productId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('increment_prompt_usage', {
      p_user_id: userId,
      p_product_id: productId,
      p_limit: FREE_TIER_DAILY_LIMIT,
    });

    if (error) {
      console.error('Error checking usage:', error);
      return { allowed: true, count: 0, limit: FREE_TIER_DAILY_LIMIT };
    }

    return {
      allowed: !data.exceeded,
      count: data.count,
      limit: data.limit,
    };
  } catch (err) {
    console.error('Usage check error:', err);
    return { allowed: true, count: 0, limit: FREE_TIER_DAILY_LIMIT };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { message, product_id, history = [], tier: _clientTier = 'free', user_id: client_user_id, enable_diagrams = false, diagram_subject = 'economics', image_data = null, trainer_test = false, search_only = false, query, prompt_product_id, spec_content } = body;

    // SECURITY: Derive user_id from auth token when available — never trust the client blindly
    let user_id = client_user_id;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
        const token = authHeader.replace("Bearer ", "");
        const { data: authData } = await anonClient.auth.getUser(token);
        if (authData?.user?.id) {
          if (user_id && user_id !== authData.user.id) {
            console.warn(`[SECURITY] user_id mismatch: body=${user_id}, token=${authData.user.id}. Using token.`);
          }
          user_id = authData.user.id;
        }
      } catch (err) {
        console.warn("Auth token verification failed, falling back to client user_id:", err);
      }
    }

    // SECURITY: Fetch user_preferences server-side — ignore any sent by the client
    let user_preferences: { year: string; predicted_grade: string; target_grade: string; additional_info: string | null } | null = null;
    if (user_id && product_id) {
      try {
        const { data: prefs } = await supabaseAdmin
          .from('user_preferences')
          .select('year, predicted_grade, target_grade, additional_info')
          .eq('user_id', user_id)
          .eq('product_id', product_id)
          .maybeSingle();
        if (prefs) {
          user_preferences = prefs;
        } else {
          // Fallback: check for preferences without product_id
          const { data: globalPrefs } = await supabaseAdmin
            .from('user_preferences')
            .select('year, predicted_grade, target_grade, additional_info')
            .eq('user_id', user_id)
            .is('product_id', null)
            .maybeSingle();
          if (globalPrefs) user_preferences = globalPrefs;
        }
      } catch (err) {
        console.error('Error fetching user preferences server-side:', err);
      }
    }

    // search_only mode: keyword search for past paper chunks, return JSON
    if (search_only && product_id) {
      const searchQuery = query || message || '';
      console.log(`search_only mode for product ${product_id}: "${searchQuery.substring(0, 80)}"`);

      // Stop words to filter out common terms that pollute search results
      const STOP_WORDS = new Set([
        'the', 'and', 'for', 'about', 'find', 'past', 'paper', 'questions', 'question',
        'with', 'how', 'what', 'does', 'this', 'that', 'are', 'was', 'were', 'been',
        'have', 'has', 'from', 'will', 'can', 'not', 'but', 'all', 'its', 'use',
        'using', 'which', 'their', 'there', 'than', 'into', 'also', 'such', 'each',
        'other', 'these', 'those', 'them', 'they', 'would', 'could', 'should', 'may',
        'might', 'must', 'when', 'where', 'why', 'who', 'whom', 'then', 'only',
        'very', 'just', 'more', 'most', 'some', 'any', 'both', 'same', 'been',
        'being', 'between', 'before', 'after', 'above', 'below', 'under', 'over',
        'again', 'further', 'here', 'once', 'during', 'while', 'through',
        'explain', 'describe', 'discuss', 'analyse', 'analyze', 'evaluate', 'assess',
        'outline', 'state', 'give', 'define', 'identify', 'suggest', 'consider',
        'marks', 'mark', 'exam', 'answer', 'level', 'grade', 'topic', 'topics',
      ]);

      const PAPER_CONTENT_TYPES = [
        'paper_1', 'paper_2', 'paper_3',
        'past_paper', 'past_paper_qp', 'combined',
        'question', 'paper',
      ];
      const EXCLUDED_CONTENT_TYPES = ['past_paper_ms', 'mark_scheme', 'specification', 'system_prompt', 'exam_technique'];

      const { data: allChunks, error: chunkError } = await supabaseAdmin
        .from('document_chunks')
        .select('id, content, metadata')
        .eq('product_id', product_id)
        .limit(5000);

      if (chunkError || !allChunks) {
        console.error('search_only chunk fetch error:', chunkError);
        return new Response(JSON.stringify({ results: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const paperChunks = allChunks.filter((c: any) => {
        const ct = String(c.metadata?.content_type || '');
        if (EXCLUDED_CONTENT_TYPES.includes(ct)) return false;
        if ((c.content || '').trim().startsWith('Mark Scheme')) return false;
        return PAPER_CONTENT_TYPES.includes(ct) || (!EXCLUDED_CONTENT_TYPES.includes(ct) && ct.includes('paper'));
      });

      // Extract keywords from query + optional spec_content, filtering stop words
      const rawWords = searchQuery.toLowerCase().split(/\s+/);
      const specWords = spec_content ? String(spec_content).toLowerCase().split(/\s+/) : [];
      const allWords = [...rawWords, ...specWords];
      const keywords = [...new Set(allWords.filter((w: string) => w.length > 2 && !STOP_WORDS.has(w)))];

      console.log(`search_only keywords after stop-word filter: [${keywords.slice(0, 10).join(', ')}] (${keywords.length} total)`);

      if (keywords.length === 0) {
        console.log('search_only: no meaningful keywords after filtering');
        return new Response(JSON.stringify({ results: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const scored = paperChunks.map((c: any) => {
        const contentText = (c.content || '').toLowerCase();
        const metaTopic = String(c.metadata?.topic || '').toLowerCase();
        const metaSection = String(c.metadata?.section || '').toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          // Content body matches (1x weight)
          const contentMatches = contentText.split(kw).length - 1;
          score += contentMatches;
          // Metadata matches get 2x bonus (topic/section are more targeted)
          if (metaTopic.includes(kw)) score += 2;
          if (metaSection.includes(kw)) score += 2;
        }
        return { ...c, similarity: score };
      }).filter((c: any) => c.similarity > 0)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 30);

      console.log(`search_only: ${paperChunks.length} paper chunks, ${scored.length} matched`);

      return new Response(JSON.stringify({ results: scored }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!message) {
      throw new Error("message is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..." (diagrams: ${enable_diagrams}, trainer_test: ${trainer_test})`);
    if (user_preferences) {
      console.log(`User preferences: Year ${user_preferences.year}, Predicted: ${user_preferences.predicted_grade}, Target: ${user_preferences.target_grade}`);
    }

    // If trainer_test flag is set, verify the user is actually a trainer/admin
    let isTrainerTest = false;
    if (trainer_test && user_id) {
      try {
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .in('role', ['trainer', 'admin']);
        
        if (roleData && roleData.length > 0) {
          isTrainerTest = true;
          console.log(`Trainer test mode enabled for user ${user_id}`);
        }
      } catch (err) {
        console.error('Error checking trainer role:', err);
      }
    }

    // Server-side subscription verification
    const BUNDLED_CHILD_TO_PARENT: Record<string, string[]> = {
      'edexcel-mathematics-applied': ['edexcel-mathematics'],
    };

    function isSubValid(sub: { tier: string; subscription_end: string | null }): boolean {
      if (sub.tier !== 'deluxe') return false;
      const now = new Date();
      const endDate = sub.subscription_end ? new Date(sub.subscription_end) : null;
      if (!endDate || endDate > now) return true;
      const graceMs = 7 * 24 * 60 * 60 * 1000;
      return now.getTime() - endDate.getTime() <= graceMs;
    }

    let tier: string = isTrainerTest ? 'deluxe' : 'free';
    if (!isTrainerTest && user_id && product_id) {
      try {
        const { data: sub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('tier, subscription_end')
          .eq('user_id', user_id)
          .eq('product_id', product_id)
          .eq('active', true)
          .maybeSingle();
        
        if (sub && isSubValid(sub)) {
          tier = 'deluxe';
          if (sub.subscription_end && new Date(sub.subscription_end) < new Date()) {
            console.log(`Deluxe tier granted via grace period for user ${user_id} (ended ${sub.subscription_end})`);
          }
        }

        if (tier === 'free') {
          const { data: currentProduct } = await supabaseAdmin
            .from('products')
            .select('slug')
            .eq('id', product_id)
            .single();
          
          if (currentProduct?.slug) {
            const parentSlugs = BUNDLED_CHILD_TO_PARENT[currentProduct.slug];
            if (parentSlugs && parentSlugs.length > 0) {
              const { data: parentProducts } = await supabaseAdmin
                .from('products')
                .select('id')
                .in('slug', parentSlugs)
                .eq('active', true);
              
              if (parentProducts && parentProducts.length > 0) {
                const parentIds = parentProducts.map((p: { id: string }) => p.id);
                const { data: parentSubs } = await supabaseAdmin
                  .from('user_subscriptions')
                  .select('tier, subscription_end')
                  .eq('user_id', user_id)
                  .in('product_id', parentIds)
                  .eq('active', true);
                
                if (parentSubs) {
                  for (const ps of parentSubs) {
                    if (isSubValid(ps)) {
                      tier = 'deluxe';
                      console.log(`Deluxe tier granted via bundled parent for user ${user_id}, product ${product_id}`);
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        if (tier === 'free') {
          const { data: currentProduct } = await supabaseAdmin
            .from('products')
            .select('slug')
            .eq('id', product_id)
            .single();
          
          if (currentProduct?.slug === 'edexcel-economics') {
            const { data: legacyUser } = await supabaseAdmin
              .from('users')
              .select('is_premium, subscription_end')
              .eq('id', user_id)
              .maybeSingle();
            
            if (legacyUser?.is_premium) {
              const endDate = legacyUser.subscription_end ? new Date(legacyUser.subscription_end) : null;
              if (!endDate || endDate > new Date()) {
                tier = 'deluxe';
                console.log(`Deluxe tier granted via legacy users table for user ${user_id}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
      }
    }
    
    console.log(`Verified tier for user ${user_id}: ${tier}`);

    // Check daily usage limit for FREE tier only
    const usageProductId = prompt_product_id || product_id;
    if (tier === 'free' && !isTrainerTest && user_id && usageProductId) {
      const usageResult = await checkAndIncrementUsage(supabaseAdmin, user_id, usageProductId);
      
      console.log(`Usage check for ${user_id}: ${usageResult.count}/${usageResult.limit} (allowed: ${usageResult.allowed})`);
      
      if (!usageResult.allowed) {
        console.warn(`[PAYWALL] Limit exceeded for user ${user_id}`, { productId: usageProductId, count: usageResult.count, limit: usageResult.limit, tier });
        const limitMessage = `🔒 **You've used all ${usageResult.limit} free prompts for today!**

To continue learning with unlimited prompts, upgrade to **Deluxe** and unlock:
- ✨ Unlimited daily prompts
- 📊 Diagram Generator tool
- 📝 Essay Marker with detailed feedback
- 🖼️ Image-to-text analysis
- 🎯 Personalized learning based on your goals

**[Upgrade to Deluxe](/compare)** to keep revising!

*Your free prompts reset at midnight.*`;

        return new Response(
          JSON.stringify({ 
            error: "limit_exceeded",
            message: limitMessage,
            usage: {
              count: usageResult.count,
              limit: usageResult.limit,
            }
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Step 1: Run search query generation AND parallel DB fetches simultaneously
    const [searchQueries, basePrompt, brainResult, feedbackResult, seasonalResult] = await Promise.all([
      generateSearchQueries(lovableApiKey, message, history),
      fetchSystemPrompt(supabaseAdmin, product_id),
      // Brain profile (deluxe only)
      (tier === 'deluxe' && user_id)
        ? Promise.resolve(supabaseAdmin.from('user_brain_profiles').select('profile_summary').eq('user_id', user_id).maybeSingle()).then((r: any) => r).catch(() => ({ data: null }))
        : Promise.resolve({ data: null }),
      // Feedback guidelines
      Promise.resolve(supabaseAdmin.from('prompt_improvements').select('guidelines').eq('product_id', product_id).maybeSingle()).then((r: any) => r).catch(() => ({ data: null })),
      // Seasonal guidelines
      Promise.resolve(supabaseAdmin.from('seasonal_prompts').select('guidelines').eq('product_id', product_id).maybeSingle()).then((r: any) => r).catch(() => ({ data: null })),
    ]);

    // Process parallel results
    let brainContext = '';
    if (brainResult?.data?.profile_summary) {
      brainContext = `\n--- A* BRAIN: STUDENT MEMORY ---
Here is context about this student from their previous sessions: ${brainResult.data.profile_summary}

Use this to personalise your responses — reference their weak areas, their exam board, and their progress where relevant. Do not explicitly tell the user you are reading their profile, just use it naturally to give more tailored responses.
---\n`;
      console.log(`Brain profile injected for user ${user_id} (${brainResult.data.profile_summary.length} chars)`);
    }

    let feedbackGuidelines = '';
    if (feedbackResult?.data?.guidelines) {
      feedbackGuidelines = `\n--- FEEDBACK-DRIVEN IMPROVEMENTS ---\n${feedbackResult.data.guidelines}\n---\n`;
      console.log(`Injected feedback guidelines for product ${product_id}`);
    }

    let seasonalGuidelines = '';
    if (seasonalResult?.data?.guidelines) {
      seasonalGuidelines = `\n${seasonalResult.data.guidelines}\n`;
      console.log(`Injected seasonal guidelines for product ${product_id}`);
    }

    // Add user personalization context
    const personalizedPrompt = buildPersonalizedPrompt(brainContext + feedbackGuidelines + seasonalGuidelines + basePrompt, user_preferences, message, product_id);
    
    // Step 2: Fetch context AND diagram in parallel (saves ~500ms)
    const contextPromise = fetchRelevantContext(
      supabaseAdmin, product_id, message, undefined, user_preferences, searchQueries,
    );

    const diagramPromise = (async () => {
      let customDiagrams: Array<{ id: string; title: string; imagePath: string; keywords?: string[] }> = [];
      try {
        const { data: trainerProject } = await supabaseAdmin
          .from('trainer_projects')
          .select('diagram_library')
          .eq('product_id', product_id)
          .eq('status', 'deployed')
          .maybeSingle();
        if (trainerProject?.diagram_library && Array.isArray(trainerProject.diagram_library)) {
          customDiagrams = trainerProject.diagram_library as typeof customDiagrams;
        }
      } catch (err) {
        console.error('Error fetching custom diagrams:', err);
      }
      if (diagram_subject === 'economics' || enable_diagrams) {
        const customIds = new Set(customDiagrams.map(d => d.id));
        const fallbackDiagrams = ECONOMICS_DIAGRAMS_FALLBACK.filter(d => !customIds.has(d.id));
        customDiagrams = [...customDiagrams, ...fallbackDiagrams];
      }
      const diagram = await findRelevantDiagram(message, customDiagrams, lovableApiKey);
      if (diagram) console.log(`Found relevant diagram: ${diagram.title}`);
      return diagram;
    })();

    const [{ context: relevantContext, sourcesSearched }, relevantDiagram] = await Promise.all([
      contextPromise, diagramPromise,
    ]);
    
    // Build final system prompt with context injection
    // INTERNAL PACING DIRECTIVE — silent, applies to all subjects/boards
    const PACING_DIRECTIVE = `INTERNAL PACING (do not mention to the user, never reference token/character/word/space limits, never say you are "running out of space" or similar): Aim to keep each response within roughly 2,500 words. Plan the structure of your answer up-front so it lands a clean, complete ending. If a topic is too large to cover fully, prioritise the most important points first and finish with a natural offer like "Want me to go deeper on [specific aspect]?" — never trail off mid-sentence or mid-list. Do not tell the user about this limit under any circumstances.\n\n`;
    let finalSystemPrompt = PACING_DIRECTIVE + personalizedPrompt;
    
    // Add essay marking instructions
    finalSystemPrompt += `\n\n--- ESSAY MARKING CAPABILITY ---
When a student asks you to mark their essay, answer, or response:
1. If they haven't specified how many marks the question is worth, ASK them: "How many marks is this question worth?" before marking.
2. Once you know the mark value, provide detailed feedback using the marking criteria from your training data.
3. Give a mark out of the total, identify what they did well, what's missing, and how to improve.
4. If they upload an image of their work, analyse it and mark it the same way.
5. Use exact marking criteria and level descriptors from your training data where available.

CRITICAL — CONCISENESS RULES FOR ALL FEEDBACK:
- Do NOT repeat, restate, or quote back the student's full answer. They already know what they wrote.
- Reference specific phrases ONLY when pointing out an error, a missing element, or suggesting a concrete improvement. Keep quotes short (a few words, not whole sentences).
- Never reproduce the student's answer line by line. Jump straight to the mark, strengths, weaknesses, and how to improve.
- Keep feedback direct and actionable. Aim for quality over quantity — a focused 150-word response beats a padded 500-word one.`;

    if (relevantContext) {
      finalSystemPrompt += `\n\n--- TRAINING DATA CONTEXT ---\nUse the following information to inform your responses:\n\n${relevantContext}`;
    }
    
    // Add general no-ASCII-diagrams rule
    finalSystemPrompt += `\n\nIMPORTANT: Never create ASCII art, text-based diagrams, or attempt to draw diagrams using characters, unicode, or markdown formatting. If no diagram image is available from the system, simply describe what the diagram would show in words.`;
    
    // Add diagram instruction if relevant
    if (relevantDiagram) {
      finalSystemPrompt += `\n\n--- DIAGRAM AVAILABLE ---
A diagram titled "${relevantDiagram.title}" will be displayed as an image within your response automatically by the system.
CRITICAL RULES:
1. Do NOT draw, create, or describe your own version of this diagram using text, ASCII art, tables, or markdown.
2. Do NOT write placeholder text like "[Insert diagram here]" or "[See diagram]" or any bracketed instructions — the system handles image insertion automatically.
3. Simply reference the diagram conversationally, e.g. "As shown in the diagram below..." or "The diagram illustrates this..."
4. Place your reference where it best supports the explanation.
5. Never use square brackets to indicate where a diagram should go.`;
    }
    
    console.log(`System prompt length: ${finalSystemPrompt.length} chars (context: ${relevantContext.length} chars)`);
    console.log(`Sources searched: ${sourcesSearched.map(s => s.topic || s.type).join(', ')}`);
    if (relevantDiagram) {
      console.log(`Diagram included: ${relevantDiagram.id}`);
    }
    
    // Build the user message content — support vision (image) when image_data provided
    let userMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    if (image_data) {
      const images = Array.isArray(image_data) ? image_data : [image_data];
      userMessageContent = [
        { type: "text", text: message || "Please analyse the attached file." },
        ...images.map((img: string) => ({ type: "image_url", image_url: { url: img } })),
      ];
    } else {
      userMessageContent = message;
    }

    // Step 3: Use unified Flash model for all chat (including essay marking)
    const aiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiModel = MODELS.fast;
    console.log(`Model selected: ${aiModel}`);

    const buildAiBody = (model: string) => JSON.stringify({
      model,
      messages: [
        { role: "system", content: finalSystemPrompt },
        ...history.slice(-10),
        { role: "user", content: userMessageContent },
      ],
      stream: true,
      max_tokens: 3500,
      temperature: 0.7,
    });

    let response = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: buildAiBody(aiModel),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm a bit busy right now — please try again in a moment!" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error(`[RAG-CHAT] AI API error (${response.status}) with model ${aiModel}:`, errorText);
      // Auto-fallback to Flash if Pro failed (handles model rejection, 400s, 503s, etc.)
      if (useProModel && response.status !== 429 && response.status !== 402) {
        console.warn(`[RAG-CHAT] Pro model failed, retrying with Flash fallback`);
        response = await fetch(aiUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: buildAiBody(MODELS.fast),
        });
        if (!response.ok) {
          const fbText = await response.text();
          console.error(`[RAG-CHAT] Fallback also failed (${response.status}):`, fbText);
          return new Response(
            JSON.stringify({ error: "Something went wrong generating a response. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Something went wrong generating a response. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Log estimated AI usage (streaming = no usage in response, so estimate from input length)
    try {
      const estInputTok = Math.ceil((finalSystemPrompt.length + JSON.stringify(history).length + (typeof message === "string" ? message.length : 0)) / 4);
      const estOutputTok = 600; // average completion length estimate
      const cost = (estInputTok / 1_000_000) * 0.30 + (estOutputTok / 1_000_000) * 2.50;
      await supabaseAdmin.from("api_usage_logs").insert({
        user_id: user_id ?? null, product_id: product_id ?? null,
        feature: "chat", model: aiModel,
        input_tokens: estInputTok, output_tokens: estOutputTok, estimated_cost_usd: cost,
      });
    } catch (logErr) { console.error("usage log failed:", logErr); }

    // Create a custom stream that prepends sources metadata and diagram info
    const encoder = new TextEncoder();
    const metadataEvent = `data: ${JSON.stringify({ 
      sources_searched: sourcesSearched,
      diagram: relevantDiagram 
    })}\n\n`;
    
    const combinedStream = new ReadableStream({
      async start(controller) {
        // Send metadata (sources + diagram) first
        controller.enqueue(encoder.encode(metadataEvent));
        
        // Then pipe through the AI response, watching for finish_reason: "length"
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let truncated = false;
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            // Inspect SSE chunks for finish_reason
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const fr = parsed?.choices?.[0]?.finish_reason;
                if (fr === "length") truncated = true;
              } catch { /* ignore non-JSON keepalives */ }
            }
          }
          // If response was truncated, append a soft footer as an extra delta
          if (truncated) {
            const footerDelta = `data: ${JSON.stringify({
              choices: [{ delta: { content: "…\n\n---\n\n**Want me to continue?** Just reply \"continue\" and I'll pick up exactly where I left off — at a natural stopping point." } }],
            })}\n\n`;
            controller.enqueue(encoder.encode(footerDelta));
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });
    
    return new Response(combinedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("RAG chat error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
