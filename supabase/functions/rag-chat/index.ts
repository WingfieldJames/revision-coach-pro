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

// Build personalized system prompt with user context
function buildPersonalizedPrompt(basePrompt: string, prefs: UserPreferences | null, userMessage: string): string {
  if (!prefs) return basePrompt;
  
  let context = `\n\n--- STUDENT CONTEXT ---`;
  context += `\nThis student is in ${prefs.year}.`;
  context += `\nTheir current/predicted grade is ${prefs.predicted_grade}.`;
  context += `\nTheir target grade is ${prefs.target_grade}.`;
  
  if (prefs.additional_info) {
    context += `\nAdditional notes from the student: "${prefs.additional_info}"`;
  }
  
  context += `\n\n--- PERSONALIZATION INSTRUCTIONS (CRITICAL) ---`;
  context += `\nYou MUST actively reference and acknowledge the student's grades in your responses. This is essential for personalization.`;
  
  // Add personalization based on grade gap
  const gradeOrder = ['D', 'C', 'B', 'A', 'A*'];
  const predictedIdx = gradeOrder.indexOf(prefs.predicted_grade);
  const targetIdx = gradeOrder.indexOf(prefs.target_grade);
  
  if (targetIdx > predictedIdx) {
    context += `\n- The student is aiming to improve from ${prefs.predicted_grade} to ${prefs.target_grade}. When giving advice, explicitly mention what a ${prefs.predicted_grade} student typically does vs what a ${prefs.target_grade} student does differently.`;
    context += `\n- When discussing technique or exam skills, say things like "As someone moving from ${prefs.predicted_grade} to ${prefs.target_grade}, you need to focus on..."`;
  } else if (targetIdx === predictedIdx) {
    context += `\n- The student is aiming to maintain their ${prefs.predicted_grade} grade. Acknowledge this and help them consolidate.`;
  }
  
  // Detect if the question is about technique/exam skills
  const techniqueKeywords = ['technique', 'how to answer', 'structure', 'marks', 'improve', 'essay', 'exam', 'approach', 'tips', 'advice'];
  const isAboutTechnique = techniqueKeywords.some(kw => userMessage.toLowerCase().includes(kw));
  
  if (isAboutTechnique) {
    context += `\n\n--- TECHNIQUE QUESTION DETECTED ---`;
    context += `\nThis student is asking about exam technique. You MUST:`;
    context += `\n1. Directly reference their current grade (${prefs.predicted_grade}) and target grade (${prefs.target_grade}) in your response.`;
    context += `\n2. Explain what separates ${prefs.predicted_grade} answers from ${prefs.target_grade} answers specifically.`;
    context += `\n3. Give concrete examples of what examiners look for at the ${prefs.target_grade} level.`;
    context += `\n4. Use phrases like "To move from your ${prefs.predicted_grade} to your target ${prefs.target_grade}..." or "Currently at ${prefs.predicted_grade}, you likely..."`;
  }
  
  // Year-specific guidance
  if (prefs.year === 'Year 12') {
    context += `\n- This is a Year 12 student. Include more foundational explanations and build from basics.`;
    context += `\n- They may not have covered all topics yet, so check their understanding of prerequisites.`;
  } else if (prefs.year === 'Year 13') {
    context += `\n- This is a Year 13 student preparing for final exams.`;
    context += `\n- Emphasize exam technique, past paper practice, and synoptic links between topics.`;
    context += `\n- Be more direct about mark scheme requirements and examiner expectations.`;
  }
  
  // Target grade specific guidance
  if (prefs.target_grade === 'A*') {
    context += `\n- For A* target: Include extension material, encourage deeper analysis, and highlight the nuances that differentiate A from A* answers.`;
    context += `\n- Mention specific A* techniques: original evaluation, chain of reasoning, sophisticated analysis.`;
  } else if (prefs.target_grade === 'A') {
    context += `\n- For A target: Focus on thoroughness, clear explanations, and avoiding common pitfalls.`;
  } else if (['B', 'C', 'D'].includes(prefs.target_grade)) {
    context += `\n- Focus on building solid foundations, getting the basics right, and avoiding common mistakes.`;
  }
  
  return basePrompt + context;
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

    const { message, product_id, user_preferences, history = [], tier = 'free', user_id } = await req.json();

    if (!message) {
      throw new Error("message is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..." (tier: ${tier})`);
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
    
    // Build final system prompt with context injection
    let finalSystemPrompt = personalizedPrompt;
    if (relevantContext) {
      finalSystemPrompt += `\n\n--- TRAINING DATA CONTEXT ---\nUse the following information to inform your responses:\n\n${relevantContext}`;
    }
    
    console.log(`System prompt length: ${finalSystemPrompt.length} chars (context: ${relevantContext.length} chars)`);
    console.log(`Sources searched: ${sourcesSearched.map(s => s.topic || s.type).join(', ')}`);

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

    // Create a custom stream that prepends sources metadata
    const encoder = new TextEncoder();
    const sourcesEvent = `data: ${JSON.stringify({ sources_searched: sourcesSearched })}\n\n`;
    
    // Combine sources event with the AI response stream
    const combinedStream = new ReadableStream({
      async start(controller) {
        // Send sources metadata first
        controller.enqueue(encoder.encode(sourcesEvent));
        
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
