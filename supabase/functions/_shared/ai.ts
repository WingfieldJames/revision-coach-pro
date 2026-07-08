// Vendor-swappable AI client. The single place any edge function talks to an
// LLM or embedding model. Replaces direct calls to the Lovable AI gateway.
//
// Providers:
//   - gemini    -> Google's OpenAI-compatible endpoint (chat)
//   - openai    -> OpenAI (embeddings, 1536-dim, unchanged from the gateway)
//   - anthropic -> Claude Messages API (marking / safeguarding)
//
// Cross-cutting: retry+backoff on 429/5xx, timeout, best-effort cost logging,
// and a model-fallback hop for the accuracy-critical marking path.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Provider = "gemini" | "openai" | "anthropic";

interface ModelSpec {
  provider: Provider;
  model: string;
  /** optional cheaper fallback if the primary hard-fails */
  fallback?: ModelSpec;
}

// Semantic aliases — functions reference these, never a raw model string.
export const MODELS: Record<string, ModelSpec> = {
  chat: { provider: "gemini", model: "gemini-2.5-flash" },
  fast: { provider: "gemini", model: "gemini-2.0-flash-lite" },
  utility: { provider: "gemini", model: "gemini-2.5-flash-lite" },
  // Accuracy-critical: Claude Sonnet, with Gemini Pro as a resilience fallback.
  marking: {
    provider: "anthropic",
    model: "claude-sonnet-5",
    fallback: { provider: "gemini", model: "gemini-2.5-pro" },
  },
  safeguarding: {
    provider: "anthropic",
    model: "claude-sonnet-5",
    fallback: { provider: "gemini", model: "gemini-2.5-flash" },
  },
};

export const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim

const GEMINI_KEY = () => Deno.env.get("GEMINI_API_KEY") || "";
const OPENAI_KEY = () => Deno.env.get("OPENAI_API_KEY") || "";
const ANTHROPIC_KEY = () => Deno.env.get("ANTHROPIC_API_KEY") || "";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  /** a MODELS alias key (e.g. "chat", "marking") or a ModelSpec */
  model: keyof typeof MODELS | ModelSpec;
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** attach for cost logging */
  logCtx?: { admin?: SupabaseClient; fn: string; userId?: string };
  timeoutMs?: number;
}

export interface ChatResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  provider: Provider;
  model: string;
}

function resolveSpec(m: ChatOptions["model"]): ModelSpec {
  return typeof m === "string" ? MODELS[m] : m;
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number })?.status;
      // Only retry transient failures.
      if (status && status !== 429 && status < 500) throw e;
      // backoff with jitter; index-derived (no Date/Math.random needed at call time)
      const base = 300 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, base + (i * 137) % 400));
    }
  }
  throw lastErr;
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

// ---- OpenAI-shaped call (Gemini chat) ----
async function callOpenAIShaped(spec: ModelSpec, opts: ChatOptions): Promise<ChatResult> {
  const key = GEMINI_KEY();
  if (!key) throw Object.assign(new Error("GEMINI_API_KEY not configured"), { status: 500 });

  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  for (const m of opts.messages) messages.push({ role: m.role, content: m.content });

  const res = await fetchWithTimeout(
    GEMINI_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: spec.model, // bare, no "google/" prefix
        messages,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    },
    opts.timeoutMs ?? 30000,
  );
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Gemini error ${res.status}: ${body}`), { status: res.status });
  }
  const data = await res.json();
  return {
    text: data?.choices?.[0]?.message?.content ?? "",
    usage: {
      inputTokens: data?.usage?.prompt_tokens ?? 0,
      outputTokens: data?.usage?.completion_tokens ?? 0,
    },
    provider: "gemini",
    model: spec.model,
  };
}

// ---- Anthropic Messages API (Claude marking/safeguarding) ----
async function callAnthropic(spec: ModelSpec, opts: ChatOptions): Promise<ChatResult> {
  const key = ANTHROPIC_KEY();
  if (!key) throw Object.assign(new Error("ANTHROPIC_API_KEY not configured"), { status: 500 });

  const res = await fetchWithTimeout(
    ANTHROPIC_URL,
    {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: spec.model,
        max_tokens: opts.maxTokens ?? 2048,
        // NB: Sonnet 5 rejects `temperature` — do not send it.
        system: opts.system, // top-level on Anthropic, not a message
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    },
    opts.timeoutMs ?? 45000,
  );
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Anthropic error ${res.status}: ${body}`), { status: res.status });
  }
  const data = await res.json();
  // Extract only text blocks; skip thinking blocks.
  const text = Array.isArray(data?.content)
    ? data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("")
    : "";
  return {
    text,
    usage: {
      inputTokens: data?.usage?.input_tokens ?? 0,
      outputTokens: data?.usage?.output_tokens ?? 0,
    },
    provider: "anthropic",
    model: spec.model,
  };
}

async function dispatch(spec: ModelSpec, opts: ChatOptions): Promise<ChatResult> {
  return spec.provider === "anthropic"
    ? await callAnthropic(spec, opts)
    : await callOpenAIShaped(spec, opts);
}

async function logUsage(opts: ChatOptions, r: ChatResult): Promise<void> {
  const admin = opts.logCtx?.admin;
  if (!admin) return;
  try {
    await admin.from("ai_usage_log").insert({
      fn: opts.logCtx!.fn,
      provider: r.provider,
      model: r.model,
      input_tokens: r.usage.inputTokens,
      output_tokens: r.usage.outputTokens,
      user_id: opts.logCtx!.userId ?? null,
    });
  } catch (_e) {
    // best-effort; never break the request over telemetry
  }
}

/** Chat completion, normalised across providers. */
export async function chatCompletion(opts: ChatOptions): Promise<ChatResult> {
  const spec = resolveSpec(opts.model);
  try {
    const r = await withRetry(() => dispatch(spec, opts));
    void logUsage(opts, r);
    return r;
  } catch (e) {
    if (spec.fallback) {
      console.error(`Primary model ${spec.provider}/${spec.model} failed; falling back.`, e);
      const r = await withRetry(() => dispatch(spec.fallback!, opts));
      void logUsage(opts, r);
      return r;
    }
    throw e;
  }
}

/** Convenience: single-turn prompt, returns the text. */
export async function chat(system: string, user: string, model: ChatOptions["model"] = "chat", extra: Partial<ChatOptions> = {}): Promise<string> {
  const r = await chatCompletion({ model, system, messages: [{ role: "user", content: user }], ...extra });
  return r.text;
}

/**
 * Escape hatch for multimodal / non-standard OpenAI-shaped bodies (e.g. vision
 * requests with image_url content that don't fit the `messages: string` shape).
 * Posts an arbitrary OpenAI-shaped body to Google's OpenAI-compat endpoint with
 * the shared key, retry, and timeout. Strip any "google/" prefix from `model`.
 */
export async function geminiChatRaw(body: Record<string, unknown>, timeoutMs = 30000): Promise<any> {
  const key = GEMINI_KEY();
  if (!key) throw Object.assign(new Error("GEMINI_API_KEY not configured"), { status: 500 });
  const model = typeof body.model === "string" ? body.model.replace(/^google\//, "") : body.model;
  const res = await withRetry(() =>
    fetchWithTimeout(
      GEMINI_URL,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, model }),
      },
      timeoutMs,
    ).then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        throw Object.assign(new Error(`Gemini error ${r.status}: ${t}`), { status: r.status });
      }
      return r;
    })
  );
  return await res.json();
}

/** OpenAI embeddings, 1536-dim. Unchanged shape from the Lovable gateway. */
export async function embed(text: string, timeoutMs = 20000): Promise<number[]> {
  const key = OPENAI_KEY();
  if (!key) throw Object.assign(new Error("OPENAI_API_KEY not configured"), { status: 500 });
  const res = await withRetry(() =>
    fetchWithTimeout(
      OPENAI_EMBED_URL,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
      },
      timeoutMs,
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text();
        throw Object.assign(new Error(`OpenAI embed error ${res.status}: ${body}`), { status: res.status });
      }
      return res;
    })
  );
  const data = await res.json();
  return data.data[0].embedding;
}
