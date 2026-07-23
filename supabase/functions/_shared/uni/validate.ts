import type { MatchInputs } from "./types.ts";

/**
 * Shape guard for request bodies, mirroring the guards in loadInputs. Used by the
 * ranking and reasons routes to reject malformed inputs before any model call.
 */
export function isMatchInputs(value: unknown): value is MatchInputs {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.subjects) &&
    Array.isArray(v.aLevels) &&
    typeof v.freeText === "string"
  );
}
