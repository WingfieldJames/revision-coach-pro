/**
 * Canonical "source of truth" for legacy subject configurations.
 * Extracted from the hardcoded Header props in each premium page.
 * Used by /build to hydrate missing fields for subjects deployed before /build existed.
 */

export interface LegacySubjectConfig {
  selectedFeatures: string[];
  examDates: Array<{ name: string; date: string }>;
  essayMarkerMarks: number[];
  essayMarkerLabel?: string;
  trainerDescription?: string;
}

// Helper to serialise Date → YYYY-MM-DD string for storage
const d = (y: number, m: number, day: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * Key format: `board::subject` (both lowercased).
 * Only includes legacy subjects that were deployed before the Build portal existed.
 */
export const LEGACY_LIVE_CONFIGS: Record<string, LegacySubjectConfig> = {
  // ── AQA Economics ──
  "aqa::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1", date: d(2026, 4, 11) },
      { name: "Paper 2", date: d(2026, 4, 18) },
      { name: "Paper 3", date: d(2026, 5, 4) },
    ],
    essayMarkerMarks: [9, 10, 15, 25],
  },

  // ── Edexcel Economics ──
  "edexcel::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Markets and Business Behaviour)", date: d(2026, 4, 11) },
      { name: "Paper 2 (The National and Global Economy)", date: d(2026, 4, 18) },
      { name: "Paper 3 (Microeconomics and Macroeconomics)", date: d(2026, 5, 4) },
    ],
    essayMarkerMarks: [],
    essayMarkerLabel: "Essay Marker",
  },

  // ── CIE Economics ──
  "cie::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Multiple Choice)", date: d(2026, 4, 12) },
      { name: "Paper 2 (Data Response & Essays)", date: d(2026, 4, 22) },
      { name: "Paper 3 (Multiple Choice)", date: d(2026, 5, 10) },
      { name: "Paper 4 (Data Response & Essays)", date: d(2026, 4, 20) },
    ],
    essayMarkerMarks: [],
  },

  // ── OCR Physics ──
  "ocr::physics": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Modelling Physics)", date: d(2026, 4, 20) },
      { name: "Paper 2 (Exploring Physics)", date: d(2026, 5, 1) },
      { name: "Paper 3 (Unified Physics)", date: d(2026, 5, 8) },
    ],
    essayMarkerMarks: [6],
    essayMarkerLabel: "6-Marker Analysis",
  },

  // ── OCR Computer Science ──
  "ocr::computer science": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Computer Systems)", date: d(2026, 5, 10) },
      { name: "Paper 2 (Algorithms & Programming)", date: d(2026, 5, 17) },
    ],
    essayMarkerMarks: [9, 12],
  },

  // ── AQA Chemistry ──
  "aqa::chemistry": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Inorganic & Physical)", date: d(2026, 4, 13) },
      { name: "Paper 2 (Organic & Physical)", date: d(2026, 4, 20) },
      { name: "Paper 3 (All topics)", date: d(2026, 5, 10) },
    ],
    essayMarkerMarks: [6],
    essayMarkerLabel: "6-Marker Analysis",
  },

  // ── AQA Psychology ──
  "aqa::psychology": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Introductory Topics)", date: d(2026, 4, 14) },
      { name: "Paper 2 (Psychology in Context)", date: d(2026, 4, 27) },
      { name: "Paper 3 (Issues and Options)", date: d(2026, 5, 8) },
    ],
    essayMarkerMarks: [16],
    essayMarkerLabel: "16-Marker Analysis",
  },

  // ── Edexcel Mathematics (Pure) ──
  "edexcel::mathematics": {
    selectedFeatures: ["my_ai", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Pure Mathematics 1)", date: d(2026, 5, 2) },
      { name: "Paper 2 (Pure Mathematics 2)", date: d(2026, 5, 9) },
      { name: "Paper 3 (Stats & Mechanics)", date: d(2026, 5, 15) },
    ],
    essayMarkerMarks: [],
  },

  // ── Edexcel Mathematics Applied ──
  "edexcel::mathematics applied": {
    selectedFeatures: ["my_ai", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Pure Mathematics 1)", date: d(2026, 5, 2) },
      { name: "Paper 2 (Pure Mathematics 2)", date: d(2026, 5, 9) },
      { name: "Paper 3 (Stats & Mechanics)", date: d(2026, 5, 15) },
    ],
    essayMarkerMarks: [],
  },
};

/**
 * Look up legacy config for a given board+subject pair.
 * Returns undefined for subjects not in the legacy map (i.e. dynamic/new subjects).
 */
export function getLegacyConfig(examBoard: string, subject: string): LegacySubjectConfig | undefined {
  const key = `${examBoard.toLowerCase()}::${subject.toLowerCase()}`;
  return LEGACY_LIVE_CONFIGS[key];
}
