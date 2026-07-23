import type { ReachLevel, RequiredSubject } from "./types.ts";

/**
 * Friendly, in-voice labels for the raw reach enum. Used on each course card.
 * Raw enums stay in state everywhere; this map is the only place they become
 * human copy. Sentence case, UK English, never the bare enum.
 */
export const REACH_LABEL: Record<ReachLevel, string> = {
  safe: "comfortable",
  match: "on target",
  reach: "a stretch",
  "hard-reach": "a long shot",
  unknown: "offer not confirmed",
};

/** A results tier: a heading, the reach bands it gathers, and an honest note
 * shown when it holds fewer than the target number of courses. */
export interface TierConfig {
  id: "comfortable" | "on-target" | "ambitious";
  heading: string;
  /** One honest line explaining a thin tier — never padded to hit the number. */
  blurbWhenThin: string;
  includes: (reach: ReachLevel) => boolean;
}

/**
 * The three tiers, in display order. The brief's "(and easy-end match)" aside is
 * read as the clean enum mapping below — `safe` → Comfortable — rather than
 * splitting the `match` band across tiers.
 */
export const TIERS: readonly TierConfig[] = [
  {
    id: "comfortable",
    heading: "Comfortable",
    blurbWhenThin:
      "At your predicted grades, few courses here sit a comfortable margin below.",
    includes: (reach) => reach === "safe",
  },
  {
    id: "on-target",
    heading: "On target",
    blurbWhenThin:
      "Only a couple of courses land right on your predicted grades.",
    includes: (reach) => reach === "match",
  },
  {
    id: "ambitious",
    heading: "Ambitious",
    blurbWhenThin:
      "Nothing here is much of a stretch for you yet — a good problem to have.",
    // `unknown` (added catalogue courses, no confirmed offer) sits here too: we
    // can't say you'll meet it, so it's treated as the most demanding reader.
    includes: (reach) =>
      reach === "reach" || reach === "hard-reach" || reach === "unknown",
  },
] as const;

/** One tier ready to render: its config, the courses that fall in it (capped and
 * in the order given), and whether it came up short of the target. */
export interface GroupedTier<T> {
  tier: TierConfig;
  courses: T[];
  isThin: boolean;
}

export interface GroupOptions {
  /** Maximum courses kept per tier. Defaults to no cap (show the curated list). */
  cap?: number;
  /** The target count a full tier holds; tiers below it are marked thin. */
  target?: number;
}

/**
 * Bucket already-ordered candidates into the three tiers, preserving the incoming
 * order (the ranking's best-first order) within each. Never pads: a tier short of
 * `target` keeps what it has and is marked thin so the UI can show an honest note
 * instead of poor-fit filler.
 *
 * Used two ways: to pick the initial selection (`{ cap: 3 }` → up to 3 per tier),
 * and to render the student's edited list (`{}` → no cap, but still flagged thin
 * against the target of 3).
 */
export function groupIntoTiers<T extends { reachLevel: ReachLevel }>(
  ranked: T[],
  { cap = Infinity, target = 3 }: GroupOptions = {},
): GroupedTier<T>[] {
  return TIERS.map((tier) => {
    const courses = ranked
      .filter((c) => tier.includes(c.reachLevel))
      .slice(0, cap);
    return { tier, courses, isThin: courses.length < target };
  });
}

/**
 * Render a course's entry requirements for self-check, e.g.
 * "requires A in Mathematics". Display only — no pass/fail is implied here.
 * Returns null when the course lists no specific subject requirement.
 */
export function formatRequirement(
  requiredSubjects: RequiredSubject[],
): string | null {
  if (requiredSubjects.length === 0) return null;
  const parts = requiredSubjects.map(
    (req) => `${req.minGrade} in ${req.subject}`,
  );
  return `requires ${parts.join(", ")}`;
}
