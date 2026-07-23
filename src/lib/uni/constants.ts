import type { Grade } from "./types";

/**
 * Course-type tags, grouped for display. Each `id` is canonical and must match
 * the `subjectTags` array on courses in data/courses.json. Never redesign the
 * existing ids. A student may tick any number across any group; buildCandidates
 * includes any course carrying ≥1 ticked tag. The first group (Business &
 * Economics) is the only one the current catalogue carries courses for; the
 * other groups are intake-only until data/courses.json grows to cover them.
 */
export const SUBJECT_GROUPS = [
  {
    name: "Business & Economics",
    subjects: [
      { id: "economics", label: "Economics" },
      { id: "economics-joint", label: "Economics (joint, e.g. with management or maths)" },
      { id: "management", label: "Management" },
      { id: "business", label: "Business" },
      { id: "finance", label: "Finance" },
      { id: "accounting", label: "Accounting" },
      { id: "ppe", label: "Philosophy, Politics & Economics (PPE)" },
    ],
  },
  {
    name: "STEM",
    subjects: [
      { id: "medicine", label: "Medicine" },
      { id: "dentistry", label: "Dentistry" },
      { id: "engineering", label: "Engineering" },
      { id: "computer-science", label: "Computer Science" },
      { id: "mathematics", label: "Maths" },
      { id: "physics", label: "Physics" },
      { id: "chemistry", label: "Chemistry" },
      { id: "biology", label: "Biology" },
      { id: "biochemistry", label: "Biochemistry" },
      { id: "biomedical-sciences", label: "Biomedical Sciences" },
      { id: "pharmacy", label: "Pharmacy" },
      { id: "data-science", label: "Data Science" },
      { id: "neuroscience", label: "Neuroscience" },
    ],
  },
  {
    name: "Humanities",
    subjects: [
      { id: "history", label: "History" },
      { id: "english-literature", label: "English Literature" },
      { id: "philosophy", label: "Philosophy" },
      { id: "classics", label: "Classics" },
      { id: "theology", label: "Theology" },
      { id: "modern-languages", label: "Modern Languages" },
      { id: "linguistics", label: "Linguistics" },
    ],
  },
  {
    name: "Social Sciences",
    subjects: [
      { id: "law", label: "Law" },
      { id: "psychology", label: "Psychology" },
      { id: "politics", label: "Politics" },
      { id: "international-relations", label: "International Relations" },
      { id: "sociology", label: "Sociology" },
      { id: "criminology", label: "Criminology" },
      { id: "geography", label: "Geography" },
    ],
  },
  {
    name: "Creative & Arts",
    subjects: [
      { id: "architecture", label: "Architecture" },
      { id: "music", label: "Music" },
      { id: "drama", label: "Drama" },
      { id: "fine-art", label: "Fine Art" },
      { id: "design", label: "Design" },
      { id: "film-studies", label: "Film Studies" },
      { id: "art-history", label: "Art History" },
      { id: "media-studies", label: "Media Studies" },
    ],
  },
  {
    name: "Other",
    subjects: [
      { id: "nursing", label: "Nursing" },
      { id: "veterinary-science", label: "Veterinary Science" },
      { id: "education", label: "Education" },
      { id: "social-work", label: "Social Work" },
      { id: "sports-science", label: "Sports Science" },
      { id: "environmental-science", label: "Environmental Science" },
    ],
  },
] as const;

/** A single course-type tag: a canonical id and its display label. */
export type Subject = { id: string; label: string };

/**
 * Flat list of every course-type tag, in group order. Derived from
 * SUBJECT_GROUPS so the catalogue loader and label lookups keep one source of
 * truth. Do not maintain a second copy.
 */
export const SUBJECTS: readonly Subject[] = SUBJECT_GROUPS.flatMap(
  (group): readonly Subject[] => group.subjects,
);

/** One selectable pill within a preference question. */
export interface PreferenceOption {
  id: string;
  label: string;
}

/**
 * A structured preference question on the intake form. `mode` is "single" (pick
 * one) or "multi" (tick several, optionally capped by `max`). When the options
 * include an "other" id, selecting it reveals a free-text input. `index` is the
 * display number, continuing the form's 01, 02 sequence.
 */
export interface PreferenceQuestion {
  id: string;
  index: string;
  title: string;
  hint: string;
  mode: "single" | "multi";
  max?: number;
  options: readonly PreferenceOption[];
}

export const PREFERENCE_QUESTIONS: readonly PreferenceQuestion[] = [
  {
    id: "location",
    index: "03",
    title: "Where would you like to study?",
    hint: "Tick as many as you like.",
    mode: "multi",
    options: [
      { id: "london", label: "London" },
      { id: "big-city", label: "Another big city" },
      { id: "campus", label: "A campus university" },
      { id: "scotland", label: "Scotland" },
      { id: "wales", label: "Wales" },
      { id: "near-home", label: "Near home" },
      { id: "anywhere", label: "Anywhere" },
      { id: "other", label: "Other" },
    ],
  },
  {
    id: "placement",
    index: "04",
    title: "Do you want a placement year?",
    hint: "Pick one.",
    mode: "single",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "dont-mind", label: "Don't mind" },
    ],
  },
  {
    id: "study-abroad",
    index: "05",
    title: "Do you want a year studying abroad?",
    hint: "Pick one.",
    mode: "single",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "dont-mind", label: "Don't mind" },
    ],
  },
  {
    id: "course-style",
    index: "06",
    title: "What style of course suits you?",
    hint: "Pick one.",
    mode: "single",
    options: [
      { id: "theoretical", label: "Very theoretical/academic" },
      { id: "applied", label: "Applied/practical" },
      { id: "mix", label: "A mix of both" },
      { id: "not-sure", label: "Not sure" },
    ],
  },
  {
    id: "after-degree",
    index: "07",
    title: "What do you want to do after your degree?",
    hint: "Pick one.",
    mode: "single",
    options: [
      { id: "work", label: "Work in this field" },
      { id: "further-study", label: "Further study (masters/PhD)" },
      { id: "unsure", label: "I don't know yet" },
      { id: "other", label: "Other" },
    ],
  },
  {
    id: "priorities",
    index: "08",
    title: "What's your priority?",
    hint: "Pick up to three.",
    mode: "multi",
    max: 3,
    options: [
      { id: "ranking", label: "Course ranking/reputation" },
      { id: "satisfaction", label: "Student satisfaction" },
      { id: "employment", label: "Graduate employment" },
      { id: "social", label: "City/social life" },
      { id: "cost", label: "Cost of living" },
      { id: "other", label: "Other" },
    ],
  },
];

/**
 * The 11 regions. `id` values are the raw strings used in courses.json, against
 * which the course loader validates each course's region; `label` is the
 * friendly display form. Students no longer pick a region (location preference
 * is expressed in free text), so this is now reference data for the catalogue.
 */
export const REGIONS = [
  { id: "London", label: "London" },
  { id: "Midlands", label: "Midlands" },
  { id: "East", label: "East of England" },
  { id: "South East", label: "South East" },
  { id: "South West", label: "South West" },
  { id: "North East", label: "North East" },
  { id: "North West", label: "North West" },
  { id: "Yorkshire", label: "Yorkshire & the Humber" },
  { id: "Scotland", label: "Scotland" },
  { id: "Wales", label: "Wales" },
  { id: "Northern Ireland", label: "Northern Ireland" },
] as const;

/**
 * A-level subjects offered in the intake. The "Mathematics" label is the only
 * one currently referenced by any course's requiredSubjects, so it must match
 * verbatim for requirement verification to work.
 */
export const A_LEVEL_SUBJECTS = [
  { id: "mathematics", label: "Mathematics" },
  { id: "further-mathematics", label: "Further Mathematics" },
  { id: "economics", label: "Economics" },
  { id: "business-studies", label: "Business Studies" },
  { id: "accounting", label: "Accounting" },
  { id: "politics", label: "Politics" },
  { id: "history", label: "History" },
  { id: "geography", label: "Geography" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "biology", label: "Biology" },
  { id: "psychology", label: "Psychology" },
  { id: "sociology", label: "Sociology" },
  { id: "english-literature", label: "English Literature" },
  { id: "computer-science", label: "Computer Science" },
  { id: "other", label: "Other" },
] as const;

/** Selectable A-level grades. */
export const GRADES: readonly Grade[] = ["A*", "A", "B", "C", "D", "E"];

/** UCAS tariff points per A-level grade. */
export const GRADE_POINTS: Record<Exclude<Grade, "">, number> = {
  "A*": 56,
  A: 48,
  B: 40,
  C: 32,
  D: 24,
  E: 16,
};

/** A-level slots collected: three to start, expandable up to five. */
export const MIN_A_LEVELS = 3;
export const MAX_A_LEVELS = 5;

/** sessionStorage key for the persisted intake inputs. */
export const INTAKE_STORAGE_KEY = "firmchoice.match.inputs";

/** sessionStorage key for the student's final, edited results list. */
export const RESULTS_STORAGE_KEY = "firmchoice.results.final";

/**
 * sessionStorage key for the cached ranking snapshot (the model's order +
 * reasons for the current inputs). Lets the results page restore without
 * re-calling the model — see lib/course-match/resultsCache.ts.
 */
export const RANKING_STORAGE_KEY = "firmchoice.results.ranking";

/** sessionStorage key for the student's personal statement draft answers. */
export const WRITE_STORAGE_KEY = "firmchoice.write.draft";

/** sessionStorage key for the student's activity card pool, captured before writing. */
export const PREPARE_STORAGE_KEY = "firmchoice.prepare.pool";

/** sessionStorage key for the arranged material columns from the organise board. */
export const ORGANISE_STORAGE_KEY = "firmchoice.organise.arrangement";
