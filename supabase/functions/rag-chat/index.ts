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

// Build personalized system prompt with user context - PREPENDED to start
function buildPersonalizedPrompt(basePrompt: string, prefs: UserPreferences | null, userMessage: string): string {
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
---

`;

  // PREPEND student context to the START of the system prompt (not append to end)
  return studentContext + basePrompt;
}

// Fetch system prompt from database for a given product
async function fetchSystemPrompt(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  tier: 'free' | 'deluxe'
): Promise<string> {
  try {
    const promptColumn = tier === 'deluxe' ? 'system_prompt_deluxe' : 'system_prompt_free';
    
    const { data, error } = await supabase
      .from('products')
      .select(`${promptColumn}, slug`)
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('Error fetching product prompt:', error);
      return FALLBACK_PROMPTS["default"];
    }
    
    const prompt = data?.[promptColumn];
    if (prompt) {
      console.log(`Using DB ${tier} prompt for product: ${data.slug}`);
      return prompt;
    }
    
    // Fallback to default if no prompt in DB
    console.log(`No ${tier} prompt in DB for ${data?.slug}, using fallback`);
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

// Query relevant document chunks from the training data
async function fetchRelevantContext(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  userMessage: string,
  contentTypes?: string[]
): Promise<FetchContextResult> {
  try {
    // Build query for document chunks
    let query = supabase
      .from('document_chunks')
      .select('content, metadata')
      .eq('product_id', productId);
    
    // If specific content types requested, filter by them
    if (contentTypes && contentTypes.length > 0) {
      // Filter by content_type in metadata JSONB
      query = query.or(
        contentTypes.map(ct => `metadata->content_type.eq.${ct}`).join(',')
      );
    }
    
    // Limit results to avoid overwhelming context
    const { data: chunks, error } = await query.limit(10);
    
    if (error) {
      console.error('Error fetching document chunks:', error);
      return { context: '', sourcesSearched: [] };
    }
    
    if (!chunks || chunks.length === 0) {
      console.log(`No training data found for product ${productId}`);
      return { context: '', sourcesSearched: [] };
    }
    
    console.log(`Found ${chunks.length} relevant chunks for context`);
    
    // Track unique sources searched
    const sourcesMap = new Map<string, { type: string; topic: string }>();
    
    // Format chunks as context
    const contextParts = chunks.map((chunk: { content: string; metadata: Record<string, unknown> }) => {
      const contentType = chunk.metadata?.content_type || 'general';
      const topic = chunk.metadata?.topic || '';
      const header = topic ? `[${String(contentType).toUpperCase()} - ${topic}]` : `[${String(contentType).toUpperCase()}]`;
      
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

    const { message, product_id, user_preferences, history = [], tier = 'free', user_id, enable_diagrams = false, diagram_subject = 'economics' } = await req.json();

    if (!message) {
      throw new Error("message is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..." (tier: ${tier}, diagrams: ${enable_diagrams})`);
    if (user_preferences) {
      console.log(`User preferences: Year ${user_preferences.year}, Predicted: ${user_preferences.predicted_grade}, Target: ${user_preferences.target_grade}`);
    }

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

    // Fetch the appropriate system prompt from database
    const basePrompt = await fetchSystemPrompt(supabaseAdmin, product_id, tier as 'free' | 'deluxe');
    
    // Add user personalization context (pass message for technique detection)
    const personalizedPrompt = buildPersonalizedPrompt(basePrompt, user_preferences, message);
    
    // Fetch relevant training data from document_chunks
    const { context: relevantContext, sourcesSearched } = await fetchRelevantContext(supabaseAdmin, product_id, message);
    
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
