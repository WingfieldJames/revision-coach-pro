#!/usr/bin/env node
/**
 * Model Comparison Test Harness
 *
 * Compares Gemini Flash, Gemini Pro, Claude Haiku, Claude Sonnet
 * on real exam marking tasks.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/model-comparison.mjs
 *
 * Optional env vars:
 *   LOVABLE_API_KEY — for Gemini models (defaults to VITE_LOVABLE_API_KEY from .env)
 *   ANTHROPIC_API_KEY — for Claude models (required)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────

// Try to load .env
try {
  const envPath = resolve(__dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  try {
    const envPath = resolve(__dirname, "../.env");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

const LOVABLE_KEY = process.env.LOVABLE_API_KEY || process.env.VITE_LOVABLE_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

const GEMINI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// ── Pricing (per 1M tokens, USD) ──────────────────────────────────────────

const PRICING = {
  "gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "gemini-2.0-pro": { input: 1.25, output: 5.00 },
  "claude-3-5-haiku": { input: 0.80, output: 4.00 },
  "claude-3-5-sonnet": { input: 3.00, output: 15.00 },
};

// ── Models ────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash (current)",
    provider: "gemini",
    model: "google/gemini-2.5-flash",
  },
  {
    id: "gemini-2.0-pro",
    name: "Gemini 2.0 Pro",
    provider: "gemini",
    model: "google/gemini-2.0-pro",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
  },
];

// ── System Prompt (simplified from real Edexcel Economics) ─────────────────

const SYSTEM_PROMPT = `You are a specialist tutor for Edexcel A-Level Economics A (9EC0). Mark student work using the exact Edexcel marking criteria.

When marking:
- Give a mark out of the total
- State the Level Band achieved
- Provide concise "Strengths and Weaknesses" feedback
- Do NOT repeat or restate the student's full answer
- Reference specific short phrases ONLY when correcting errors
- Conclude with "Push to the Next Level" advice

Mark ceilings (absolute): 5-mark max 5, 8-mark max 8, 12-mark max 12, 15-mark max 15, 25-mark max 25.
Mark Addition Rule: KAA: X + Evaluation: Y = Total: Z. Show arithmetic.

--- RESPONSE CONCISENESS ---
Keep feedback direct and actionable. A focused 150-word response beats a padded 500-word one.`;

// ── Test Cases ────────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    name: "Short answer (5 marks) — Define + identify",
    question: "With reference to Extract A, identify two significant features of the data shown. (5 marks)\n\nExtract A: UK CPI inflation rose from 0.7% in January 2021 to a peak of 11.1% in October 2022, before falling to 6.7% by September 2023. The Bank of England base rate was held at 0.1% until December 2021, then increased 14 consecutive times to reach 5.25% by August 2023.",
    student_answer: "One significant feature is that inflation rose sharply from 0.7% to 11.1% between January 2021 and October 2022, which is an increase of over 10 percentage points in less than two years. This suggests the UK experienced a severe inflationary period. A second feature is that the Bank of England raised interest rates 14 times to reach 5.25% by August 2023, indicating a tight monetary policy response to combat the rising inflation.",
    marks: 5,
    type: "5-marker",
  },
  {
    name: "Medium essay (12 marks) — Evaluate",
    question: "With reference to the extracts and your own knowledge, evaluate the trade-offs the Bank of England faces when setting interest rates during a period of high inflation and low economic growth. (12 marks)",
    student_answer: `The Bank of England faces a significant policy dilemma when confronted with stagflation — high inflation combined with low growth. This creates a trade-off because the tools to address one problem exacerbate the other.

Raising interest rates would help reduce demand-pull inflation by making borrowing more expensive, reducing consumer spending and investment. This works through the transmission mechanism: higher base rate → higher mortgage and loan rates → lower disposable income → lower AD → downward pressure on prices. The data shows the MPC raised rates to 5.25%, and mortgage approvals did fall 28%.

However, higher interest rates also reduce economic growth. If the economy is already experiencing low growth, further rate rises could push the UK into recession. Business investment fell 1.2% in Q2 2023, suggesting the rate rises were already dampening growth. This could lead to higher unemployment, creating a further welfare loss.

Furthermore, if inflation is predominantly cost-push (driven by supply-side shocks like energy prices), then demand-side monetary policy may be ineffective at controlling inflation while still causing the negative growth effects. The extract suggests some economists believe this is the case.

On the other hand, the Bank must maintain credibility. If it fails to act on inflation, inflation expectations could become de-anchored, leading to a wage-price spiral that would be harder to control later. The 2% target exists precisely to anchor expectations.

Overall, the trade-off depends on whether inflation is demand-pull or cost-push. For cost-push inflation, rate rises may cause more harm than good, and the Bank should consider forward guidance and patience rather than aggressive tightening.`,
    marks: 12,
    type: "12-marker",
  },
  {
    name: "Long essay (25 marks) — Evaluate with diagram",
    question: "Evaluate the view that monopoly power is always detrimental to consumer welfare. Refer to at least one diagram in your answer. (25 marks)",
    student_answer: `Monopoly power refers to the ability of a firm to set prices above marginal cost due to a lack of competition. The traditional view is that monopolies harm consumer welfare through higher prices, lower output, and reduced allocative efficiency. However, this essay will argue that while monopoly can harm consumers, it is not always detrimental.

A monopolist maximises profit where MC=MR, producing at Qm and charging Pm. Compared to a perfectly competitive market, where P=MC at Qc and Pc, the monopolist charges a higher price and produces less output. This creates a deadweight loss triangle, representing a net loss of consumer and producer surplus. Consumer surplus is significantly reduced compared to perfect competition, as consumers pay more for less. This supports the view that monopoly is detrimental.

Furthermore, monopolists may exhibit X-inefficiency — costs rise above the minimum because there is no competitive pressure to minimise costs. This means the AC curve is higher than necessary, further reducing potential consumer benefit. Leibenstein argued this is a major cost of monopoly beyond the standard deadweight loss.

However, monopolies can achieve economies of scale that smaller competitive firms cannot. A natural monopoly has a continuously falling LRAC curve, meaning one firm can supply the entire market at a lower average cost than multiple firms. In this case, the monopolist may charge a lower price than would exist under competition, actually benefiting consumers. Examples include water companies and railway infrastructure.

Additionally, Schumpeter argued that monopoly profits fund research and development, leading to dynamic efficiency. Innovation creates new and better products, which benefits consumers in the long run. Firms like Apple and pharmaceutical companies invest billions in R&D partly because they can earn supernormal profits. Without this incentive, innovation might slow.

Price discrimination by a monopolist can also benefit some consumers. Third-degree price discrimination (charging different prices to different groups) can mean that consumers with elastic demand (e.g. students) pay lower prices than they would under a single monopoly price. This increases output and can improve allocative efficiency.

In evaluation, whether monopoly is detrimental depends on several factors. First, it depends on the extent of barriers to entry — if the market is contestable, even a monopolist must keep prices competitive to deter hit-and-run entry. Second, it depends on regulation — the CMA and Ofwat/Ofgem can use price capping (RPI-X) to limit monopoly pricing while maintaining investment incentives. Third, it depends on the industry — natural monopolies may genuinely serve consumers better than fragmented competition.

In conclusion, while the standard monopoly model shows clear consumer welfare losses through higher prices and deadweight loss, this is not always the case in practice. Natural monopolies, dynamic efficiency from R&D investment, and effective regulation can all mitigate the harms. The statement is too absolute — monopoly power is often, but not always, detrimental to consumer welfare.`,
    marks: 25,
    type: "25-marker",
  },
];

// ── API Callers ───────────────────────────────────────────────────────────

async function callGemini(model, systemPrompt, userMessage) {
  const start = Date.now();
  let ttft = null;
  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { error: `${res.status}: ${err}`, ttft: null, totalTime: Date.now() - start, content: "", inputTokens: 0, outputTokens: 0 };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          if (ttft === null) ttft = Date.now() - start;
          fullContent += token;
        }
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens || 0;
          outputTokens = parsed.usage.completion_tokens || 0;
        }
      } catch {}
    }
  }

  // Estimate tokens if not provided
  if (!inputTokens) inputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
  if (!outputTokens) outputTokens = Math.ceil(fullContent.length / 4);

  return {
    ttft,
    totalTime: Date.now() - start,
    content: fullContent,
    inputTokens,
    outputTokens,
  };
}

async function callAnthropic(model, systemPrompt, userMessage) {
  if (!ANTHROPIC_KEY) {
    return { error: "ANTHROPIC_API_KEY not set", ttft: null, totalTime: 0, content: "", inputTokens: 0, outputTokens: 0 };
  }

  const start = Date.now();
  let ttft = null;
  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { error: `${res.status}: ${err}`, ttft: null, totalTime: Date.now() - start, content: "", inputTokens: 0, outputTokens: 0 };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          if (ttft === null) ttft = Date.now() - start;
          fullContent += parsed.delta.text;
        }
        if (parsed.type === "message_start" && parsed.message?.usage) {
          inputTokens = parsed.message.usage.input_tokens || 0;
        }
        if (parsed.type === "message_delta" && parsed.usage) {
          outputTokens = parsed.usage.output_tokens || 0;
        }
      } catch {}
    }
  }

  if (!inputTokens) inputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
  if (!outputTokens) outputTokens = Math.ceil(fullContent.length / 4);

  return {
    ttft,
    totalTime: Date.now() - start,
    content: fullContent,
    inputTokens,
    outputTokens,
  };
}

// ── Runner ────────────────────────────────────────────────────────────────

function calcCost(modelId, inputTokens, outputTokens) {
  const p = PRICING[modelId];
  if (!p) return 0;
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

async function runTest(testCase, model) {
  const userMessage = `Mark this student's answer.\n\nQUESTION (${testCase.type}, ${testCase.marks} marks):\n${testCase.question}\n\nSTUDENT'S ANSWER:\n${testCase.student_answer}`;

  const caller = model.provider === "gemini" ? callGemini : callAnthropic;
  const result = await caller(model.model, SYSTEM_PROMPT, userMessage);

  return {
    model: model.id,
    modelName: model.name,
    testCase: testCase.name,
    ...result,
    cost: result.error ? 0 : calcCost(model.id, result.inputTokens, result.outputTokens),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== A* AI Model Comparison Test ===\n");

  if (!LOVABLE_KEY) {
    console.error("WARNING: No LOVABLE_API_KEY found — Gemini models will fail.\n");
  }
  if (!ANTHROPIC_KEY) {
    console.error("WARNING: No ANTHROPIC_API_KEY found — Claude models will be skipped.\n");
  }

  const allResults = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n--- Test: ${testCase.name} ---\n`);

    const results = [];

    for (const model of MODELS) {
      process.stdout.write(`  ${model.name}... `);
      const result = await runTest(testCase, model);
      results.push(result);

      if (result.error) {
        console.log(`ERROR: ${result.error}`);
      } else {
        console.log(
          `TTFT: ${result.ttft}ms | Total: ${result.totalTime}ms | In: ${result.inputTokens} | Out: ${result.outputTokens} | Cost: $${result.cost.toFixed(4)}`
        );
      }
    }

    // Print comparison table
    console.log("\n  | Model | TTFT | Total | In Tokens | Out Tokens | Cost | Words |");
    console.log("  |-------|------|-------|-----------|------------|------|-------|");
    for (const r of results) {
      if (r.error) {
        console.log(`  | ${r.modelName} | ERROR | ${r.error.substring(0, 40)} |`);
      } else {
        const words = r.content.split(/\s+/).filter(Boolean).length;
        console.log(
          `  | ${r.modelName.padEnd(28)} | ${String(r.ttft).padStart(5)}ms | ${String(r.totalTime).padStart(6)}ms | ${String(r.inputTokens).padStart(9)} | ${String(r.outputTokens).padStart(10)} | $${r.cost.toFixed(4).padStart(6)} | ${String(words).padStart(5)} |`
        );
      }
    }

    allResults.push(...results);
  }

  // Save full results to JSON
  const outputPath = resolve(__dirname, "model-comparison-results.json");
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        testCases: TEST_CASES.map((tc) => tc.name),
        results: allResults.map((r) => ({
          model: r.model,
          modelName: r.modelName,
          testCase: r.testCase,
          ttft: r.ttft,
          totalTime: r.totalTime,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          cost: r.cost,
          wordCount: r.content ? r.content.split(/\s+/).filter(Boolean).length : 0,
          response: r.content || r.error || "",
        })),
      },
      null,
      2
    )
  );

  console.log(`\n\nFull results saved to: ${outputPath}`);
  console.log("\nReview the JSON file to compare response quality side by side.");
}

main().catch(console.error);
