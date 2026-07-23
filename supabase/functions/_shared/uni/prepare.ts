// Pure subset of firmchoice/lib/course-match/prepare.ts. The sessionStorage
// helpers (savePool / loadPool / pushToSupabase) are client-only and stripped —
// the server needs only the ActivityCard shape and the type enum.

/**
 * The fixed set of activity types a student can tag a card with. `id` values are
 * the canonical enum kept in state and persisted; `label` is the friendly form
 * shown in the UI only. Never rename or redesign these.
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
