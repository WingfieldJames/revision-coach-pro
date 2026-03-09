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
  trainerName?: string;
  trainerDescription?: string;
  trainerStatus?: string;
  /** Static asset path for the trainer profile image (used as fallback when no storage upload exists) */
  trainerImageAsset?: string;
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
    trainerName: "Etienne",
    trainerDescription: "Hi, I'm Etienne — founder of EasyNomics, UKMT Gold Award winner, and John Locke Economics shortlisted. I trained A* AI on AQA Economics to help you achieve the top grades.",
    trainerStatus: "BSc Economics Student",
    trainerImageAsset: "/src/assets/etienne-founder.png",
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
    trainerName: "James",
    trainerDescription: "Hi, I'm James — I got A* in Economics with 90% across all papers, A*A*A at A-Level, and straight 9s at GCSE. I'm studying at LSE and built A* AI to help you achieve the same results.",
    trainerStatus: "LSE Student",
    trainerImageAsset: "/src/assets/james-founder.png",
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
    trainerName: "Carl",
    trainerDescription: "Hi, I'm Carl — I got A*A*A* at A-Level as an international student and achieved 5A*s in IGCSE in one year. I'm studying at LSE and trained A* AI on CIE Economics.",
    trainerStatus: "LSE Student",
    trainerImageAsset: "/src/assets/carl-founder.png",
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
    trainerName: "Tudor",
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 200/200 in Physics and straight 9s at GCSE. I trained A* AI on OCR Physics past papers and mark schemes to help you ace your exams.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/tudor-founder.jpg",
  },

  // ── OCR Computer Science ──
  "ocr::computer science": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Computer Systems)", date: d(2026, 5, 10) },
      { name: "Paper 2 (Algorithms & Programming)", date: d(2026, 5, 17) },
    ],
    essayMarkerMarks: [9, 12],
    trainerName: "Naman",
    trainerDescription: "Hi, I'm Naman — I got A*A*A*A* at A-Level with straight 9s at GCSE and an 8.9 TMUA score. I trained A* AI on OCR Computer Science to help you master algorithms, data structures, and exam technique.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/naman-founder.png",
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
    trainerName: "Tudor",
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 197/200 in Chemistry and straight 9s at GCSE. I trained A* AI on AQA Chemistry to help you master every topic and ace your exams.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/tudor-founder.jpg",
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
    trainerName: "Tudor",
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level and straight 9s at GCSE. I trained A* AI on AQA Psychology past papers, mark schemes and specification to help you achieve top grades.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/tudor-founder.jpg",
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
    trainerName: "Tudor",
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 236/240 in Mathematics and straight 9s at GCSE. I trained A* AI on Edexcel Maths past papers and specifications.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/tudor-founder.jpg",
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
    trainerName: "Tudor",
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 236/240 in Mathematics and straight 9s at GCSE. I trained A* AI on Edexcel Maths Applied (Stats & Mechanics) content.",
    trainerStatus: "Gap Year Student",
    trainerImageAsset: "/src/assets/tudor-founder.jpg",
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
