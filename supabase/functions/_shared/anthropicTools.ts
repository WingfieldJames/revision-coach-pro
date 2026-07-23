// Forced-tool-call helper for the Anthropic Messages API, used by the uni-*
// (FirmChoice port) functions. ai.ts covers plain text completions but does not
// support `tools` / `tool_choice` and does not export its withRetry — so the
// retry/timeout idiom is mirrored here locally rather than editing ai.ts.
//
// Mirrors the FirmChoice routes' request construction exactly: system as a
// single cacheable text block, tool_choice forced to the named tool, and no
// `temperature` (Sonnet rejects it).

export interface AnthropicToolCallOpts {
  model: string;
  system: string;
  tools: unknown[];
  /** The tool the model is forced to call; its `input` is the return value. */
  toolName: string;
  messages: { role: "user"; content: string }[];
  maxTokens: number;
  timeoutMs?: number;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Local mirror of ai.ts's withRetry (2 attempts, backoff with jitter). */
async function withRetry<T>(fn: () => Promise<T>, tries = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // A timeout already waited the full duration — don't retry it.
      if ((e as { name?: string })?.name === "AbortError") throw e;
      const status = (e as { status?: number })?.status;
      // Only retry transient failures (429 / 5xx).
      if (status && status !== 429 && status < 500) throw e;
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

/**
 * POST a forced tool call to the Anthropic Messages API and return the first
 * `tool_use` block's `input`. Throws (with a response-body snippet) on a
 * non-2xx or when no tool_use block comes back — callers decide whether that
 * degrades (rank) or errors (reasons / organise).
 */
export async function anthropicToolCall(opts: AnthropicToolCallOpts): Promise<unknown> {
  const key = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!key) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY not configured"), { status: 500 });
  }

  return await withRetry(async () => {
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
          model: opts.model,
          max_tokens: opts.maxTokens,
          // NB: no `temperature` — Sonnet rejects it (same rule as ai.ts).
          system: [
            {
              type: "text",
              text: opts.system,
              cache_control: { type: "ephemeral" },
            },
          ],
          tools: opts.tools,
          tool_choice: { type: "tool", name: opts.toolName },
          messages: opts.messages,
        }),
      },
      opts.timeoutMs ?? 60000,
    );

    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(
        new Error(`Anthropic tool call failed (${res.status}): ${body.slice(0, 300)}`),
        { status: res.status },
      );
    }

    const data = await res.json();
    const block = Array.isArray(data?.content)
      ? data.content.find((b: { type: string }) => b.type === "tool_use")
      : undefined;
    if (!block || !("input" in block)) {
      throw new Error(
        `Anthropic response had no tool_use block for "${opts.toolName}" ` +
          `(stop_reason: ${data?.stop_reason ?? "unknown"})`,
      );
    }
    return (block as { input: unknown }).input;
  });
}
