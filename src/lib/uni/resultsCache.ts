import { pushToSupabase } from "./storage";
import { RANKING_STORAGE_KEY } from "./constants";
import type { MatchResult } from "./ranking";
import type { MatchInputs } from "./types";

/**
 * Cache of an expensive ranking run so the results page can restore without
 * re-calling the model. The model's order + candidate courses (`matched`) and
 * the one-line reasons are the two Claude calls behind /results; persisting
 * them means navigating away and back never re-spends those calls.
 *
 * `signature` ties the cache to the exact inputs it was computed for. When the
 * student changes their match answers the signature no longer matches and the
 * results regenerate; an unchanged set restores instantly.
 */
export interface RankingSnapshot {
  signature: string;
  matched: MatchResult;
  /** courseId → one-line reason. May be partial if saved before reasons land. */
  reasons: Record<string, string>;
}

/** Stable, order-independent fingerprint of the inputs a ranking depends on. */
export function inputsSignature(inputs: MatchInputs): string {
  const sortedKeys = (r: Record<string, unknown>) =>
    Object.fromEntries(Object.keys(r).sort().map((k) => [k, r[k]]));
  return JSON.stringify({
    // Order-independent: ticking the same subjects in any order is one query.
    subjects: [...inputs.subjects].sort(),
    customSubject: inputs.customSubject.trim(),
    // A-level order is the student's own; keep it.
    aLevels: inputs.aLevels.map((a) => ({
      subject: a.subject,
      otherSubject: a.otherSubject ?? "",
      grade: a.grade,
    })),
    preferences: sortedKeys(inputs.preferences),
    preferenceOther: sortedKeys(inputs.preferenceOther),
    freeText: inputs.freeText.trim(),
  });
}

/** Persist the ranking snapshot (sessionStorage + Supabase mirror). No-op during SSR. */
export function saveRankingSnapshot(snapshot: RankingSnapshot): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(snapshot));
  pushToSupabase(RANKING_STORAGE_KEY, snapshot);
}

/**
 * Read the cached ranking, but only if it was computed for `inputs` — a
 * signature mismatch (the student edited their answers) or any malformed blob
 * returns null, so the caller regenerates rather than showing stale results.
 */
export function loadRankingSnapshot(inputs: MatchInputs): RankingSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RANKING_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RankingSnapshot>;
    if (
      typeof parsed.signature !== "string" ||
      !parsed.matched ||
      !Array.isArray(parsed.matched.order) ||
      !Array.isArray(parsed.matched.courses)
    ) {
      return null;
    }
    if (parsed.signature !== inputsSignature(inputs)) return null;
    return {
      signature: parsed.signature,
      matched: parsed.matched as MatchResult,
      reasons:
        parsed.reasons && typeof parsed.reasons === "object" ? parsed.reasons : {},
    };
  } catch {
    return null;
  }
}
