import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Economics Diagrams for inline rendering
const ECONOMICS_DIAGRAMS = [
  { id: 'ppf', title: 'Production Possibility Frontier (PPF)', keywords: ['ppf', 'production possibility frontier', 'ppc', 'opportunity cost', 'trade-off', 'scarcity'], imagePath: '/diagrams/ppf.jpg' },
  { id: 'ppf-shift', title: 'Shift of PPF', keywords: ['ppf shift', 'economic growth', 'outward shift', 'inward shift', 'productive capacity'], imagePath: '/diagrams/ppf-shift.jpg' },
  { id: 'supply-demand-equilibrium', title: 'Supply and Demand Equilibrium', keywords: ['supply and demand', 'equilibrium', 'market equilibrium', 'market clearing'], imagePath: '/diagrams/supply-demand-equilibrium.jpg' },
  { id: 'demand-shift-right', title: 'Demand Shifts Right (Increase in Demand)', keywords: ['demand increase', 'demand shift right', 'rise in demand', 'rightward shift demand'], imagePath: '/diagrams/demand-shift-right.jpg' },
  { id: 'demand-shift-left', title: 'Demand Shifts Left (Decrease in Demand)', keywords: ['demand decrease', 'demand shift left', 'fall in demand', 'leftward shift demand'], imagePath: '/diagrams/demand-shift-left.jpg' },
  { id: 'supply-shift-right', title: 'Supply Shifts Right (Increase in Supply)', keywords: ['supply increase', 'supply shift right', 'rise in supply'], imagePath: '/diagrams/supply-shift-right.jpg' },
  { id: 'supply-shift-left', title: 'Supply Shifts Left (Decrease in Supply)', keywords: ['supply decrease', 'supply shift left', 'fall in supply'], imagePath: '/diagrams/supply-shift-left.jpg' },
  { id: 'specific-tax', title: 'Specific Tax', keywords: ['specific tax', 'indirect tax', 'per unit tax'], imagePath: '/diagrams/specific-tax.jpg' },
  { id: 'ad-valorem-tax', title: 'Ad Valorem Tax', keywords: ['ad valorem', 'percentage tax', 'vat'], imagePath: '/diagrams/ad-valorem-tax.jpg' },
  { id: 'subsidy', title: 'Subsidy', keywords: ['subsidy', 'government subsidy', 'price subsidy'], imagePath: '/diagrams/subsidy.jpg' },
  { id: 'maximum-price', title: 'Maximum Price (Price Ceiling)', keywords: ['maximum price', 'price ceiling', 'price cap', 'rent control'], imagePath: '/diagrams/maximum-price.jpg' },
  { id: 'minimum-price', title: 'Minimum Price (Price Floor)', keywords: ['minimum price', 'price floor', 'minimum wage'], imagePath: '/diagrams/minimum-price.jpg' },
  { id: 'negative-externality-production', title: 'Negative Externality in Production', keywords: ['negative externality', 'external cost', 'market failure', 'msc', 'mpc', 'welfare loss'], imagePath: '/diagrams/negative-externality-production.jpg' },
  { id: 'positive-externality-consumption', title: 'Positive Externality in Consumption', keywords: ['positive externality', 'external benefit', 'msb', 'mpb', 'merit good'], imagePath: '/diagrams/positive-externality-consumption.jpg' },
  { id: 'producer-consumer-surplus', title: 'Producer and Consumer Surplus', keywords: ['consumer surplus', 'producer surplus', 'total surplus', 'welfare'], imagePath: '/diagrams/producer-consumer-surplus.jpg' },
  { id: 'ad-sras', title: 'AD/AS Model', keywords: ['aggregate demand', 'aggregate supply', 'ad/as', 'ad as', 'macroeconomic equilibrium'], imagePath: '/diagrams/ad-as-basic.png' },
  { id: 'demand-pull-inflation', title: 'Demand-Pull Inflation', keywords: ['demand pull inflation', 'demand pull', 'ad shift right'], imagePath: '/diagrams/demand-pull-inflation.jpg' },
  { id: 'cost-push-inflation', title: 'Cost-Push Inflation', keywords: ['cost push inflation', 'cost push', 'sras shift left'], imagePath: '/diagrams/cost-push-inflation.jpg' },
  { id: 'monopoly', title: 'Monopoly Diagram', keywords: ['monopoly', 'monopolist', 'price maker', 'supernormal profit', 'deadweight loss'], imagePath: '/diagrams/monopoly.png' },
  { id: 'perfect-competition', title: 'Perfect Competition', keywords: ['perfect competition', 'price taker', 'normal profit', 'perfectly competitive'], imagePath: '/diagrams/perfect-competition.png' },
  { id: 'circular-flow', title: 'Circular Flow of Income', keywords: ['circular flow', 'injections', 'withdrawals', 'leakages', 'national income'], imagePath: '/diagrams/circular-flow-of-income.jpg' },
  { id: 'phillips-curve', title: 'Phillips Curve', keywords: ['phillips curve', 'inflation unemployment trade-off'], imagePath: '/diagrams/phillips-curve.png' },
  { id: 'trade-cycle', title: 'Trade/Business Cycle', keywords: ['trade cycle', 'business cycle', 'boom', 'recession', 'recovery', 'slump'], imagePath: '/diagrams/trade-cycle.jpg' },
  { id: 'profit-maximisation', title: 'Profit Maximisation (MC=MR)', keywords: ['profit maximisation', 'mc=mr', 'profit maximizing', 'marginal cost marginal revenue'], imagePath: '/diagrams/profit-maximisation.jpg' },
  { id: 'price-discrimination', title: 'Price Discrimination', keywords: ['price discrimination', 'first degree', 'second degree', 'third degree'], imagePath: '/diagrams/price-discrimination.jpg' },
];

// CS Diagrams for inline rendering
const CS_DIAGRAMS = [
  { id: 'von-neumann-architecture', title: 'Von Neumann Architecture', keywords: ['von neumann', 'cpu', 'processor', 'ram', 'memory', 'bus', 'data bus', 'address bus', 'control bus', 'alu', 'control unit', 'registers', 'mar', 'mdr', 'pc', 'program counter', 'cir', 'accumulator', 'fetch decode execute', 'fde'], imagePath: '/diagrams/cs/von-neumann-architecture.jpg' },
  { id: 'and-gate', title: 'AND Gate', keywords: ['and gate', 'logic gate', 'boolean and', 'truth table and'], imagePath: '/diagrams/cs/and-gate.jpg' },
  { id: 'or-gate', title: 'OR Gate', keywords: ['or gate', 'logic gate', 'boolean or', 'truth table or'], imagePath: '/diagrams/cs/or-gate.jpg' },
  { id: 'xor-gate', title: 'XOR Gate', keywords: ['xor gate', 'exclusive or', 'logic gate'], imagePath: '/diagrams/cs/xor-gate.jpg' },
  { id: 'not-gate', title: 'NOT Gate', keywords: ['not gate', 'inverter', 'logic gate', 'negation'], imagePath: '/diagrams/cs/not-gate.jpg' },
  { id: 'half-adder', title: 'Half Adder', keywords: ['half adder', 'adder', 'binary addition', 'sum bit', 'carry bit'], imagePath: '/diagrams/cs/half-adder.jpg' },
  { id: 'full-adder', title: 'Full Adder', keywords: ['full adder', 'adder', 'carry in', 'carry out', 'ripple carry'], imagePath: '/diagrams/cs/full-adder.jpg' },
  { id: 'd-flip-flop', title: 'D Flip-Flop (Clock)', keywords: ['flip-flop', 'flip flop', 'latch', 'clock', 'd flip-flop', 'register', 'memory element'], imagePath: '/diagrams/cs/d-flip-flop.jpg' },
  { id: 'array', title: 'Array', keywords: ['array', 'data structure', 'index', 'element', 'contiguous memory'], imagePath: '/diagrams/cs/array.jpg' },
  { id: 'stack', title: 'Stack', keywords: ['stack', 'push', 'pop', 'lifo', 'last in first out', 'top pointer'], imagePath: '/diagrams/cs/stack.jpg' },
  { id: 'queue', title: 'Queue', keywords: ['queue', 'enqueue', 'dequeue', 'fifo', 'first in first out', 'front pointer', 'rear pointer'], imagePath: '/diagrams/cs/queue.jpg' },
  { id: 'graph', title: 'Graph', keywords: ['graph', 'node', 'vertex', 'edge', 'adjacency'], imagePath: '/diagrams/cs/graph.jpg' },
  { id: 'tree', title: 'Tree', keywords: ['tree', 'root', 'parent', 'child', 'leaf', 'node', 'hierarchical'], imagePath: '/diagrams/cs/tree.jpg' },
  { id: 'binary-search-tree', title: 'Binary Search Tree', keywords: ['binary search tree', 'bst', 'binary tree', 'ordered tree'], imagePath: '/diagrams/cs/binary-search-tree.jpg' },
  { id: 'post-order-traversal', title: 'Post Order Traversal', keywords: ['post order', 'postorder', 'tree traversal', 'traversal', 'left right root'], imagePath: '/diagrams/cs/post-order-traversal.jpg' },
];

// Find relevant diagram based on message content
function findRelevantDiagram(message: string, subject: string): { id: string; title: string; imagePath: string } | null {
  const lowerMessage = message.toLowerCase();
  const diagramSet = subject === 'cs' ? CS_DIAGRAMS : ECONOMICS_DIAGRAMS;
  
  for (const diagram of diagramSet) {
    for (const keyword of diagram.keywords) {
      if (lowerMessage.includes(keyword)) {
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
      lowerMessage.includes('past paper') || lowerMessage.includes('example')) {
    priorities.push(CONTENT_TYPES.PAPER_1, CONTENT_TYPES.PAPER_2, CONTENT_TYPES.PAPER_3,
      'past_paper', 'past_paper_qp', 'past_paper_ms', 'combined');
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

// Query relevant document chunks from the training data
// Fetches a balanced mix across content types so no single type dominates
async function fetchRelevantContext(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  userMessage: string,
  contentTypes?: string[],
  userPreferences?: UserPreferences | null
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
    
    // Group chunks by content_type
    const chunksByType = new Map<string, Array<{ content: string; metadata: Record<string, unknown> }>>();
    for (const chunk of filteredChunks) {
      const ct = (chunk.metadata as Record<string, unknown>)?.content_type as string || 'general';
      if (!chunksByType.has(ct)) chunksByType.set(ct, []);
      chunksByType.get(ct)!.push(chunk);
    }
    
    console.log(`Content types available: ${Array.from(chunksByType.entries()).map(([k, v]) => `${k}(${v.length})`).join(', ')}`);
    
    // Build balanced selection: prioritized types get more slots
    const MAX_CHUNKS = 40;
    const selectedChunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];
    
    // Allocate slots: prioritized types first, then remaining types equally
    const prioritizedTypes = effectiveContentTypes.filter(t => chunksByType.has(t));
    const remainingTypes = Array.from(chunksByType.keys()).filter(t => !prioritizedTypes.includes(t));
    
    // Give prioritized types ~60% of slots, remaining types ~40%
    const prioritySlots = prioritizedTypes.length > 0 
      ? Math.floor(MAX_CHUNKS * 0.6 / prioritizedTypes.length) 
      : 0;
    const remainingSlots = remainingTypes.length > 0 
      ? Math.floor(MAX_CHUNKS * 0.4 / remainingTypes.length) 
      : Math.floor(MAX_CHUNKS / Math.max(prioritizedTypes.length, 1));
    
    // Add prioritized chunks
    for (const ct of prioritizedTypes) {
      const chunks = chunksByType.get(ct)!;
      const limit = Math.min(chunks.length, prioritySlots || Math.floor(MAX_CHUNKS / chunksByType.size));
      selectedChunks.push(...chunks.slice(0, limit));
    }
    
    // Add remaining type chunks
    for (const ct of remainingTypes) {
      const chunks = chunksByType.get(ct)!;
      const limit = Math.min(chunks.length, remainingSlots);
      selectedChunks.push(...chunks.slice(0, limit));
    }
    
    // If still under MAX_CHUNKS, fill with any remaining chunks
    if (selectedChunks.length < MAX_CHUNKS) {
      const selectedSet = new Set(selectedChunks);
      for (const chunk of filteredChunks) {
        if (selectedChunks.length >= MAX_CHUNKS) break;
        if (!selectedSet.has(chunk)) {
          selectedChunks.push(chunk);
          selectedSet.add(chunk);
        }
      }
    }
    
    console.log(`Selected ${selectedChunks.length} balanced chunks from ${filteredChunks.length} total`);
    
    // Track unique sources searched
    const sourcesMap = new Map<string, { type: string; topic: string }>();
    
    // Format chunks as context
    const contextParts = selectedChunks.map((chunk) => {
      const contentType = chunk.metadata?.content_type || 'general';
      const topic = chunk.metadata?.topic || '';
      const header = topic 
        ? `[${String(contentType).toUpperCase()} - ${topic}]` 
        : `[${String(contentType).toUpperCase()}]`;
      
      const sourceKey = `${contentType}-${topic}`;
      if (!sourcesMap.has(sourceKey)) {
        sourcesMap.set(sourceKey, { type: String(contentType), topic: String(topic) });
      }
      
      return `${header}\n${chunk.content}`;
    });
    
    return {
      context: contextParts.join('\n\n---\n\n'),
      sourcesSearched: Array.from(sourcesMap.values()),
    };
  } catch (err) {
    console.error('Error in fetchRelevantContext:', err);
    return { context: '', sourcesSearched: [] };
  }
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
      // Allow on error to prevent blocking legitimate users
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
    const { message, product_id, user_preferences, history = [], tier: _clientTier = 'free', user_id, enable_diagrams = false, diagram_subject = 'economics', image_data = null, trainer_test = false, search_only = false, query, prompt_product_id } = body;

    // search_only mode: keyword search for past paper chunks, return JSON
    if (search_only && product_id) {
      const searchQuery = query || message || '';
      console.log(`search_only mode for product ${product_id}: "${searchQuery.substring(0, 80)}"`);

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

      // Filter to paper-type chunks only
      const paperChunks = allChunks.filter((c: any) => {
        const ct = String(c.metadata?.content_type || '');
        // Exclude mark schemes and non-paper content
        if (EXCLUDED_CONTENT_TYPES.includes(ct)) return false;
        // Exclude chunks that start with "Mark Scheme"
        if ((c.content || '').trim().startsWith('Mark Scheme')) return false;
        // Include known paper types, or anything not explicitly excluded
        return PAPER_CONTENT_TYPES.includes(ct) || (!EXCLUDED_CONTENT_TYPES.includes(ct) && ct.includes('paper'));
      });

      // Score by keyword relevance
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const scored = paperChunks.map((c: any) => {
        const text = (c.content + ' ' + JSON.stringify(c.metadata || {})).toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          const matches = text.split(kw).length - 1;
          score += matches;
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

    // Server-side subscription verification - never trust client tier
    // Trainers testing their own product bypass subscription check
    
    // Bundled product mapping: child slug -> parent slugs that also grant access
    const BUNDLED_CHILD_TO_PARENT: Record<string, string[]> = {
      'edexcel-mathematics-applied': ['edexcel-mathematics'],
    };

    // Helper: check if a subscription row is valid (active + not expired, with grace period)
    function isSubValid(sub: { tier: string; subscription_end: string | null }): boolean {
      if (sub.tier !== 'deluxe') return false;
      const now = new Date();
      const endDate = sub.subscription_end ? new Date(sub.subscription_end) : null;
      if (!endDate || endDate > now) return true;
      // 7-day grace period for monthly webhook delays
      const graceMs = 7 * 24 * 60 * 60 * 1000;
      return now.getTime() - endDate.getTime() <= graceMs;
    }

    let tier: string = isTrainerTest ? 'deluxe' : 'free';
    if (!isTrainerTest && user_id && product_id) {
      try {
        // 1) Check exact product_id match first
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

        // 2) If not deluxe yet, check bundled parent products
        if (tier === 'free') {
          // Look up the current product's slug to find parent bundles
          const { data: currentProduct } = await supabaseAdmin
            .from('products')
            .select('slug')
            .eq('id', product_id)
            .single();
          
          if (currentProduct?.slug) {
            const parentSlugs = BUNDLED_CHILD_TO_PARENT[currentProduct.slug];
            if (parentSlugs && parentSlugs.length > 0) {
              // Find parent product IDs
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

        // 3) Legacy fallback: check users table for edexcel-economics backward compatibility
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

    // Check daily usage limit for FREE tier only (skip for trainer tests)
    // Use prompt_product_id if provided (shares quota across related products like Pure/Applied maths)
    const usageProductId = prompt_product_id || product_id;
    if (tier === 'free' && !isTrainerTest && user_id && usageProductId) {
      const usageResult = await checkAndIncrementUsage(supabaseAdmin, user_id, usageProductId);
      
      console.log(`Usage check for ${user_id}: ${usageResult.count}/${usageResult.limit} (allowed: ${usageResult.allowed})`);
      
      if (!usageResult.allowed) {
        // Return a special response for limit exceeded
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

    // Fetch the deluxe system prompt from database (unified for all users)
    const basePrompt = await fetchSystemPrompt(supabaseAdmin, product_id);
    
    // Check if user has A* Brain enabled and fetch their brain profile
    let brainContext = '';
    if (tier === 'deluxe' && user_id) {
      try {
        const { data: brainProfile } = await supabaseAdmin
          .from('user_brain_profiles')
          .select('profile_summary')
          .eq('user_id', user_id)
          .maybeSingle();
        
        if (brainProfile?.profile_summary) {
          brainContext = `\n--- A* BRAIN: STUDENT MEMORY ---
Here is context about this student from their previous sessions: ${brainProfile.profile_summary}

Use this to personalise your responses — reference their weak areas, their exam board, and their progress where relevant. Do not explicitly tell the user you are reading their profile, just use it naturally to give more tailored responses.
---\n`;
          console.log(`Brain profile injected for user ${user_id} (${brainProfile.profile_summary.length} chars)`);
        }
      } catch (err) {
        console.error('Error fetching brain profile:', err);
      }
    }
    
    // Add user personalization context (pass message for technique detection)
    const personalizedPrompt = buildPersonalizedPrompt(brainContext + basePrompt, user_preferences, message, product_id);
    
    // Fetch relevant training data from document_chunks (with spec_version filtering for Psychology)
    const { context: relevantContext, sourcesSearched } = await fetchRelevantContext(
      supabaseAdmin, 
      product_id, 
      message,
      undefined,
      user_preferences
    );
    
    // Always try to find a relevant diagram based on message content
    let relevantDiagram: { id: string; title: string; imagePath: string } | null = null;
    const diagramSubject = enable_diagrams ? diagram_subject : 'economics';
    relevantDiagram = findRelevantDiagram(message, diagramSubject);
    if (relevantDiagram) {
      console.log(`Found relevant diagram: ${relevantDiagram.title}`);
    }
    
    // Build final system prompt with context injection
    let finalSystemPrompt = personalizedPrompt;
    
    // Add essay marking instructions
    finalSystemPrompt += `\n\n--- ESSAY MARKING CAPABILITY ---
When a student asks you to mark their essay, answer, or response:
1. If they haven't specified how many marks the question is worth, ASK them: "How many marks is this question worth?" before marking.
2. Once you know the mark value, provide detailed feedback using the marking criteria from your training data.
3. Give a mark out of the total, identify what they did well, what's missing, and how to improve.
4. If they upload an image of their work, analyse it and mark it the same way.
5. Use exact marking criteria and level descriptors from your training data where available.`;

    if (relevantContext) {
      finalSystemPrompt += `\n\n--- TRAINING DATA CONTEXT ---\nUse the following information to inform your responses:\n\n${relevantContext}`;
    }
    
    // Add diagram instruction if relevant
    if (relevantDiagram) {
      finalSystemPrompt += `\n\n--- DIAGRAM AVAILABLE ---\nA relevant diagram is available for this topic: "${relevantDiagram.title}". The system will display this diagram automatically alongside your response. Reference it naturally in your explanation where appropriate.`;
    }
    
    console.log(`System prompt length: ${finalSystemPrompt.length} chars (context: ${relevantContext.length} chars)`);
    console.log(`Sources searched: ${sourcesSearched.map(s => s.topic || s.type).join(', ')}`);
    if (relevantDiagram) {
      console.log(`Diagram included: ${relevantDiagram.id}`);
    }
    // Build the user message content — support vision (image) when image_data provided
    let userMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    if (image_data) {
      userMessageContent = [
        { type: "text", text: message || "Please analyse the attached file." },
        { type: "image_url", image_url: { url: image_data } },
      ];
    } else {
      userMessageContent = message;
    }

    // Call AI gateway for response (streaming)
    const aiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiModel = "google/gemini-2.5-flash";

    const response = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...history,
          { role: "user", content: userMessageContent },
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
        
        // Then pipe through the AI response
        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
