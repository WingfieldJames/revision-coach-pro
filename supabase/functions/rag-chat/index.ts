import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  "ocr-physics-deluxe": "ocr-physics",
  // Add more products here as needed
};

function getSystemPrompt(productId: string): string {
  const promptKey = PRODUCT_PROMPT_MAP[productId] || "default";
  return SYSTEM_PROMPTS[promptKey] || SYSTEM_PROMPTS["default"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const { message, product_id, history = [] } = await req.json();

    if (!message) {
      throw new Error("message is required");
    }

    console.log(`RAG chat for product ${product_id}: "${message.substring(0, 50)}..."`);

    // Get the appropriate system prompt based on product
    const systemPrompt = getSystemPrompt(product_id);
    console.log(`Using system prompt for: ${PRODUCT_PROMPT_MAP[product_id] || "default"}`);

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
