import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, imageType } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt based on image type
    let systemPrompt = `You are an expert at analyzing economics exam materials for A-Level students. Your task is to extract and format content from images so students can paste it into a chatbot for help.`;
    
    let userPrompt = '';
    switch (imageType) {
      case 'exam-question':
        userPrompt = `This is an exam question image. Please:
1. Transcribe the EXACT question text, including any sub-parts (a, b, c, etc.)
2. Note the mark allocation for each part if visible
3. Describe any diagrams, graphs, or tables included
4. Format it clearly so it can be pasted into a chatbot

Output format:
**Question:** [transcribed question]
**Marks:** [mark allocation if visible]
**Diagrams/Data:** [description of any visual elements]`;
        break;
      case 'diagram':
        userPrompt = `This is an economics diagram. Please:
1. Identify the type of diagram (e.g., AD/AS, supply/demand, buffer stock, etc.)
2. Describe all axes, curves, and labels
3. Explain any shifts, equilibrium points, or annotations shown
4. Format it so a student can ask for help understanding or recreating it

Output format:
**Diagram Type:** [type of diagram]
**Axes:** [x-axis and y-axis labels]
**Curves/Lines:** [list all curves with their labels]
**Key Points:** [equilibrium points, shifts, shaded areas, etc.]
**Description:** [brief explanation of what the diagram shows]`;
        break;
      case 'notes':
        userPrompt = `This is a page of economics notes or textbook content. Please:
1. Transcribe the key information and concepts
2. Organize bullet points and definitions clearly
3. Note any formulas, diagrams, or examples mentioned
4. Format it so a student can ask questions about the content

Output format:
**Topic:** [main topic if identifiable]
**Key Concepts:** [bullet points of main ideas]
**Definitions:** [any key terms defined]
**Examples/Data:** [any examples or statistics mentioned]`;
        break;
      default:
        userPrompt = `Please analyze this economics-related image and extract all relevant text and information. Format it clearly so a student can paste it into a chatbot to get help. Include:
- Any questions or text content
- Description of diagrams or graphs
- Key data or statistics
- Context about what the image shows`;
    }

    console.log("Sending image to Lovable AI for analysis, type:", imageType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { url: image }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content;

    if (!extractedText) {
      console.error("No content in response:", data);
      return new Response(
        JSON.stringify({ error: 'No content extracted from image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Successfully analyzed image");

    return new Response(
      JSON.stringify({ extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-image function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
