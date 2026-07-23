import { pushToSupabase } from "./storage";
import { PREPARE_STORAGE_KEY } from "./constants";

/**
 * The fixed set of activity types a student can tag a card with. `id` values are
 * the canonical enum kept in state and persisted; `label` is the friendly form
 * shown in the UI only — same discipline as REACH_LABEL and the subject tags.
 * Never rename or redesign these.
 */
export const ACTIVITY_TYPES = [
  { id: "reading", label: "Reading" },
  { id: "academic", label: "Something from my A-levels" },
  { id: "competition", label: "Competition or olympiad" },
  { id: "lecture_course", label: "Lecture, talk or online course" },
  { id: "work_exp", label: "Work experience or placement" },
  { id: "observation", label: "Something I noticed in the world" },
  { id: "project", label: "A project I made or led" },
  { id: "responsibility", label: "A role or responsibility" },
  { id: "volunteering", label: "Volunteering" },
  { id: "other", label: "Something else" },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["id"];

/**
 * One activity card in the student's material pool. Raw `type` enum is stored;
 * `did` is what they did, `reflection` is what they took from it (the field that
 * matters), `subjectLink` is an optional tie to their subject.
 */
export interface ActivityCard {
  id: string;
  type: string;
  did: string;
  reflection: string;
  subjectLink: string;
}

/** Friendly label for a raw activity-type id, falling back to the raw value. */
export function activityLabel(type: string): string {
  return ACTIVITY_TYPES.find((t) => t.id === type)?.label ?? type;
}

/**
 * A card is unfinished when the student has said what they did but not what they
 * took from it. Reflection is the point of the screen — this is the single
 * source of truth for the incomplete flag.
 */
export function needsReflection(card: ActivityCard): boolean {
  return card.did.trim() !== "" && card.reflection.trim() === "";
}

/** Persist the activity pool for the next stage. No-op during SSR. */
export function savePool(cards: ActivityCard[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PREPARE_STORAGE_KEY, JSON.stringify(cards));
  pushToSupabase(PREPARE_STORAGE_KEY, cards);
}

/** Read the persisted activity pool, or an empty pool if absent or unparseable. */
export function loadPool(): ActivityCard[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(PREPARE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityCard[];
  } catch {
    return [];
  }
}
