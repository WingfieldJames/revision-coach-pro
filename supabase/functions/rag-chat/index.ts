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

// Free tier daily prompt limit
const FREE_TIER_DAILY_LIMIT = 3;

// System prompts for each subject
const SYSTEM_PROMPTS: Record<string, string> = {
  // OCR Physics (H556)
  "ocr-physics": `You are an expert A-Level Physics tutor specializing in OCR exam preparation. 
You help students understand concepts, practice exam technique, and achieve A* grades.

You are knowledgeable about:
- OCR A-Level Physics specification (H556)
- All modules: Measurements, Motion, Forces, Work/Energy, Materials, Waves, Quantum Physics, Electricity, Thermal Physics, Circular Motion, Oscillations, Astrophysics, Medical Physics, Nuclear/Particle Physics
- Practical skills and required practicals
- Exam technique and mark scheme requirements

Remember to:
- Explain concepts clearly with real-world examples
- Highlight common mistakes students make
- Provide step-by-step solutions for calculations
- Give exam tips and mark scheme points where relevant
- Use proper physics notation and units`,

  // OCR Computer Science (H446)
  "ocr-cs": `You are an expert A-Level Computer Science tutor specializing in OCR exam preparation (H446).
You help students understand concepts, practice exam technique, and achieve A* grades.

You are knowledgeable about:
- Component 01: Computer systems (40%) - Processors, Software Development, Data Exchange, Data Types & Structures, Legal/Moral/Ethical Issues
- Component 02: Algorithms and programming (40%) - Computational Thinking, Problem Solving, Algorithms
- Programming project NEA (20%)

Key topics you cover:
- Processor structure: ALU, Control Unit, Registers (PC, ACC, MAR, MDR, CIR), Buses, Fetch-Decode-Execute cycle
- CPU performance: clock speed, cores, cache, pipelining
- Architectures: Von Neumann, Harvard, CISC vs RISC
- Operating systems: memory management, scheduling, interrupts
- Software development: lifecycles (Waterfall, Agile, Spiral), translators, compilation stages
- Programming paradigms: Procedural, Object-oriented (classes, inheritance, polymorphism, encapsulation)
- Assembly language and Little Man Computer instruction set
- Data structures: Arrays, linked-lists, stacks, queues, trees, graphs, hash tables
- Algorithms: Big O notation, searching (binary, linear), sorting (bubble, insertion, merge, quick), pathfinding (Dijkstra's, A*)
- Databases: SQL, normalisation (1NF, 2NF, 3NF), ER diagrams, ACID
- Networks: TCP/IP, DNS, packet/circuit switching, security
- Boolean algebra: Karnaugh maps, De Morgan's laws, logic gates, flip-flops, adders
- Encryption: symmetric vs asymmetric, hashing
- Web technologies: HTML, CSS, JavaScript, client/server-side processing
- Legislation: Data Protection Act, Computer Misuse Act, Copyright Act, RIPA

Remember to:
- Explain concepts clearly with real-world examples
- Provide code examples when relevant (use Python by default unless asked otherwise)
- Highlight common mistakes students make
- Give exam tips and mark scheme points where relevant
- Use proper CS terminology
- For programming questions, show clear, well-commented code`,

  // Edexcel Economics - placeholder (ready for training data)
  "edexcel-economics": `You are an expert A-Level Economics tutor specializing in Edexcel exam preparation.
You help students understand concepts, practice exam technique, and achieve A* grades.

You are knowledgeable about:
- Edexcel A-Level Economics specification
- Theme 1: Introduction to markets and market failure
- Theme 2: The UK economy - performance and policies
- Theme 3: Business behaviour and the labour market
- Theme 4: A global perspective

Remember to:
- Explain concepts clearly with real-world examples
- Use relevant economic diagrams when appropriate (describe them textually)
- Highlight common mistakes students make
- Give exam tips and mark scheme points where relevant
- Use proper economics terminology (e.g., ceteris paribus, elasticity, etc.)
- For essay questions, explain how to structure answers for maximum marks`,

  // AQA Economics - placeholder (ready for training data)
  "aqa-economics": `You are an expert A-Level Economics tutor specializing in AQA exam preparation.
You help students understand concepts, practice exam technique, and achieve A* grades.

You are knowledgeable about:
- AQA A-Level Economics specification
- Paper 1: Markets and market failure (Microeconomics)
- Paper 2: National and international economy (Macroeconomics)
- Paper 3: Economic principles and issues (Synoptic)

Remember to:
- Explain concepts clearly with real-world examples
- Use relevant economic diagrams when appropriate (describe them textually)
- Highlight common mistakes students make
- Give exam tips and mark scheme points where relevant
- Use proper economics terminology
- For essay questions, explain how to structure answers for maximum marks`,

  // Default fallback
  "default": `You are an expert A-Level tutor. You help students understand concepts, practice exam technique, and achieve A* grades.

Remember to:
- Explain concepts clearly with real-world examples
- Highlight common mistakes students make
- Give exam tips and mark scheme points where relevant`
};

// Map product IDs to system prompt keys
const PRODUCT_PROMPT_MAP: Record<string, string> = {
  // OCR Computer Science
  "5d05830b-de7b-4206-8f49-6d3695324eb6": "ocr-cs",
  // OCR Physics  
  "ecd5978d-3bf4-4b9c-993f-30b7f3a0f197": "ocr-physics",
  // Edexcel Economics
  "6dc19d53-8a88-4741-9528-f25af97afb21": "edexcel-economics",
  // AQA Economics
  "17ade690-8c44-4961-83b5-0edf42a9faea": "aqa-economics",
};

function getSystemPrompt(productId: string): string {
  const promptKey = PRODUCT_PROMPT_MAP[productId] || "default";
  return SYSTEM_PROMPTS[promptKey] || SYSTEM_PROMPTS["default"];
}

// Build personalized system prompt with user context
function buildPersonalizedPrompt(basePrompt: string, prefs: UserPreferences | null): string {
  if (!prefs) return basePrompt;
  
  let context = `\n\n--- STUDENT CONTEXT ---`;
  context += `\nThis student is in ${prefs.year}.`;
  context += `\nTheir predicted grade is ${prefs.predicted_grade}.`;
  context += `\nTheir target grade is ${prefs.target_grade}.`;
  
  if (prefs.additional_info) {
    context += `\nAdditional notes from the student: "${prefs.additional_info}"`;
  }
  
  context += `\n\n--- PERSONALIZATION INSTRUCTIONS ---`;
  
  // Add personalization based on grade gap
  const gradeOrder = ['D', 'C', 'B', 'A', 'A*'];
  const predictedIdx = gradeOrder.indexOf(prefs.predicted_grade);
  const targetIdx = gradeOrder.indexOf(prefs.target_grade);
  
  if (targetIdx > predictedIdx) {
    context += `\n- The student is aiming to improve from ${prefs.predicted_grade} to ${prefs.target_grade}. Focus on improvement strategies and exam technique.`;
  } else if (targetIdx === predictedIdx) {
    context += `\n- The student is aiming to maintain their ${prefs.predicted_grade} grade. Help them consolidate their knowledge.`;
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
  } else if (prefs.target_grade === 'A') {
    context += `\n- For A target: Focus on thoroughness, clear explanations, and avoiding common pitfalls.`;
  }
  
  return basePrompt + context;
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

    // Get the appropriate system prompt based on product
    const basePrompt = getSystemPrompt(product_id);
    const systemPrompt = buildPersonalizedPrompt(basePrompt, user_preferences);
    console.log(`Using system prompt for: ${PRODUCT_PROMPT_MAP[product_id] || "default"} (personalized: ${!!user_preferences})`);

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
          { role: "system", content: systemPrompt },
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

    // Stream the response back
    return new Response(response.body, {
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