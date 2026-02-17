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
  if (subject !== 'cs') return null;
  
  const lowerMessage = message.toLowerCase();
  
  for (const diagram of CS_DIAGRAMS) {
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
    priorities.push(CONTENT_TYPES.PAPER_1, CONTENT_TYPES.PAPER_2, CONTENT_TYPES.PAPER_3);
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
// Unified: all users get full training data (no tier filtering)
async function fetchRelevantContext(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  userMessage: string,
  contentTypes?: string[],
  userPreferences?: UserPreferences | null
): Promise<FetchContextResult> {
  try {
    // Detect content type priorities if not explicitly provided
    const effectiveContentTypes = contentTypes && contentTypes.length > 0 
      ? contentTypes 
      : detectContentTypePriorities(userMessage);
    
    console.log(`Content type priorities: ${effectiveContentTypes.join(', ')}`);
    
    // Build query for document chunks - filter by product_id only
    // All users get full training data (tier distinction removed)
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('content, metadata')
      .eq('product_id', productId)
      .limit(30);
    
    if (error) {
      console.error('Error fetching document chunks:', error);
      return { context: '', sourcesSearched: [] };
    }
    
    if (!chunks || chunks.length === 0) {
      console.log(`No training data found for product ${productId}`);
      return { context: '', sourcesSearched: [] };
    }
    
    // For Psychology product, filter specification chunks by spec_version based on user year
    let filteredChunks = chunks;
    if (productId === PSYCHOLOGY_PRODUCT_ID && userPreferences) {
      const specVersion = userPreferences.year === 'Year 12' ? '2027' : '2026';
      console.log(`Psychology spec filtering: Year ${userPreferences.year} -> spec_version ${specVersion}`);
      
      filteredChunks = chunks.filter((chunk: { content: string; metadata: Record<string, unknown> }) => {
        const metadata = chunk.metadata || {};
        // Non-specification chunks are shared across both specs
        if (metadata.content_type !== 'specification') return true;
        // Specification chunks: only include matching spec_version
        return metadata.spec_version === specVersion;
      });
      
      console.log(`Filtered from ${chunks.length} to ${filteredChunks.length} chunks after spec_version filtering`);
    }
    
    console.log(`Found ${filteredChunks.length} relevant chunks for context`);
    
    // Track unique sources searched
    const sourcesMap = new Map<string, { type: string; topic: string }>();
    
    // Format chunks as context
    const contextParts = filteredChunks.map((chunk: { content: string; metadata: Record<string, unknown> }) => {
      const contentType = chunk.metadata?.content_type || 'general';
      const topic = chunk.metadata?.topic || '';
      const contentTier = chunk.metadata?.tier || 'all';
      const header = topic 
        ? `[${String(contentType).toUpperCase()} - ${topic}]` 
        : `[${String(contentType).toUpperCase()}]`;
      
      // Track this source
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

    const { message, product_id, user_preferences, history = [], tier: _clientTier = 'free', user_id, enable_diagrams = false, diagram_subject = 'economics' } = await req.json();

    if (!message) {
      throw new Error("message is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..." (diagrams: ${enable_diagrams})`);
    if (user_preferences) {
      console.log(`User preferences: Year ${user_preferences.year}, Predicted: ${user_preferences.predicted_grade}, Target: ${user_preferences.target_grade}`);
    }

    // Server-side subscription verification - never trust client tier
    let tier: string = 'free';
    if (user_id && product_id) {
      try {
        const { data: sub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('tier, subscription_end')
          .eq('user_id', user_id)
          .eq('product_id', product_id)
          .eq('active', true)
          .maybeSingle();
        
        if (sub?.tier === 'deluxe') {
          if (!sub.subscription_end || new Date(sub.subscription_end) > new Date()) {
            tier = 'deluxe';
          }
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
      }
    }
    
    console.log(`Verified tier for user ${user_id}: ${tier}`);

    // Check daily usage limit for FREE tier only
    if (tier === 'free' && user_id && product_id) {
      const usageResult = await checkAndIncrementUsage(supabaseAdmin, user_id, product_id);
      
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
    
    // Add user personalization context (pass message for technique detection)
    const personalizedPrompt = buildPersonalizedPrompt(basePrompt, user_preferences, message, product_id);
    
    // Fetch relevant training data from document_chunks (with spec_version filtering for Psychology)
    const { context: relevantContext, sourcesSearched } = await fetchRelevantContext(
      supabaseAdmin, 
      product_id, 
      message,
      undefined,
      user_preferences
    );
    
    // Find relevant diagram for deluxe users
    let relevantDiagram: { id: string; title: string; imagePath: string } | null = null;
    if (enable_diagrams && tier === 'deluxe') {
      relevantDiagram = findRelevantDiagram(message, diagram_subject);
      if (relevantDiagram) {
        console.log(`Found relevant diagram: ${relevantDiagram.title}`);
      }
    }
    
    // Build final system prompt with context injection
    let finalSystemPrompt = personalizedPrompt;
    if (relevantContext) {
      finalSystemPrompt += `\n\n--- TRAINING DATA CONTEXT ---\nUse the following information to inform your responses:\n\n${relevantContext}`;
    }
    
    // Add diagram instruction for deluxe users if relevant
    if (relevantDiagram) {
      finalSystemPrompt += `\n\n--- DIAGRAM AVAILABLE ---\nA relevant diagram is available for this topic: "${relevantDiagram.title}". The system will display this diagram automatically. Reference it in your explanation where appropriate.`;
    }
    
    console.log(`System prompt length: ${finalSystemPrompt.length} chars (context: ${relevantContext.length} chars)`);
    console.log(`Sources searched: ${sourcesSearched.map(s => s.topic || s.type).join(', ')}`);
    if (relevantDiagram) {
      console.log(`Diagram included: ${relevantDiagram.id}`);
    }
    // Call Lovable AI for response (streaming)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: finalSystemPrompt },
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
