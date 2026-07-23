import { GRADE_POINTS } from "./constants";
import type { Grade, RequiredSubject } from "./types";

const VALID_GRADES = new Set<string>(["A*", "A", "B", "C", "D", "E"]);

/** Sum of UCAS tariff points for a set of grades. Empty slots count as zero. */
export function gradesToPoints(grades: Grade[]): number {
  return grades.reduce((sum, g) => sum + (g ? GRADE_POINTS[g] : 0), 0);
}

/**
 * Parse an offer grade string like "A*A*A" into its grades and tariff points.
 * Handles the two-character "A*". Throws on an unrecognised character so bad
 * data fails the loader rather than silently scoring zero.
 */
export function parseOffer(offer: string): { grades: Grade[]; points: number } {
  const grades: Grade[] = [];
  for (let i = 0; i < offer.length; i += 1) {
    let token = offer[i];
    if (token === "A" && offer[i + 1] === "*") {
      token = "A*";
      i += 1;
    }
    if (!VALID_GRADES.has(token)) {
      throw new Error(`Unrecognised grade "${token}" in offer "${offer}"`);
    }
    grades.push(token as Grade);
  }
  return { grades, points: gradesToPoints(grades) };
}

/**
 * Parse a requirement string like "Mathematics (A)" into { subject, minGrade }.
 * Returns null if it doesn't match the expected shape.
 */
export function parseRequiredSubject(raw: string): RequiredSubject | null {
  const match = raw.match(/^(.+?)\s*\(([A-E*]+)\)$/);
  if (!match) return null;
  const grade = match[2];
  if (!VALID_GRADES.has(grade)) return null;
  return { subject: match[1].trim(), minGrade: grade as Grade };
}
