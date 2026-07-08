import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chatCompletion } from "../_shared/ai.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "find-diagram"), ...RATE_LIMITS.chat });

    const { text, custom_diagrams } = await req.json();

    if (!text || typeof text !== 'string') {
      return err("Text is required", 400);
    }

    // ONLY use custom diagrams from Build portal — no hardcoded fallbacks
    if (!custom_diagrams || !Array.isArray(custom_diagrams) || custom_diagrams.length === 0) {
      console.log('No custom diagrams provided — returning null');
      return json({ diagramId: null });
    }

    const availableDiagrams = custom_diagrams.map((d: any) => ({
      id: d.id,
      title: d.title,
      keywords: [d.title],
    }));

    const diagramList = availableDiagrams.map((d: any) =>
      `- ID: "${d.id}" | Title: "${d.title}"`
    ).join('\n');

    const systemPrompt = `You are a precise diagram matcher for A-Level Economics and other subjects. Given a student's question or topic text, determine which single diagram best illustrates the CORE concept. Return ONLY a JSON object.

PRECISION RULES — read carefully:
1. Match on the COMPLETE CONCEPT, never on partial word overlap.
2. EXTERNALITIES vs EXTERNAL COSTS/BENEFITS — these are DIFFERENT diagrams:
   - "Externalities", "negative externality", "positive externality", "market failure due to externalities" → match "Negative Externality of Production" or "Positive Externality of Consumption"
   - "External cost" or "external benefit" are NOT the same as externality diagrams — only use those if the student literally says "external cost" or "external benefit"
   - The word "external" appearing in a title does NOT mean it is about externalities
3. MICRO vs MACRO — never confuse them:
   - Individual markets, price changes, supply/demand shifts → use Supply and Demand / shift diagrams
   - Whole economy, national output, price level → use AD/SRAS diagrams
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
   - "Business cycle" / "trade cycle" / "boom and bust" → "Trade Cycle (Business Cycle)"
   - "Circular flow" → "Circular Flow of Income"
   - "Diminishing returns" / "marginal product" → "MP and AP (Diminishing Returns)"
   - "Shut down" → "Short Run Shut Down Point" or "Long Run Shut Down Point" based on context
5. Be generous — if the topic relates to any diagram, match it.
6. If genuinely no diagram fits, return null.

Available diagrams:
${diagramList}

Response format (JSON only, no explanation):
{"diagramId": "diagram-id-here"} or {"diagramId": null}`;

    const aiResult = await chatCompletion({
      model: "chat",
      system: systemPrompt,
      messages: [
        { role: "user", content: text },
      ],
      logCtx: { admin, fn: "find-diagram", userId: user.id },
    });
    const content = aiResult.text;

    // Log AI usage
    try {
      const inputTok = aiResult.usage.inputTokens || 0;
      const outputTok = aiResult.usage.outputTokens || 0;
      const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
      await admin.from("api_usage_logs").insert({
        user_id: user.id, feature: "diagram", model: "google/gemini-2.5-flash",
        input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
      });
    } catch (logErr) { console.error("usage log failed:", logErr); }

    let diagramId: string | null = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        diagramId = parsed.diagramId;
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Validate that the diagram ID exists in the provided custom diagrams
    if (diagramId && !availableDiagrams.find((d: any) => d.id === diagramId)) {
      console.warn('AI returned invalid diagram ID:', diagramId);
      diagramId = null;
    }

    return json({ diagramId });
  } catch (e) {
    return toResponse(e);
  }
});
