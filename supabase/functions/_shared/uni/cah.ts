/**
 * CAH (HESA Common Aggregation Hierarchy) → FirmChoice subject ids.
 *
 * Discover Uni courses are tagged with CAH level-3 codes (`cah_codes`, e.g.
 * "CAH09-01-01"); the matching UI works in our own ~50 subject ids (see
 * SUBJECT_GROUPS in constants.ts). This map bridges the two so DB courses can be
 * filtered by the subjects a student ticks.
 *
 * Built by sampling real course titles per code against the live data. It is
 * deliberately pragmatic, not exhaustive: a code maps to one or more subjects
 * where the fit is clear; unmapped codes simply yield no tag (the course is
 * still searchable, just not surfaced by subject matching). Known gaps —
 * joint/niche subjects the CAH can't isolate — are noted inline:
 *   - PPE / economics-joint: CAH can't separate joint economics, so they alias
 *     to the broad economics codes.
 *   - classics: no dedicated CAH; aliased loosely to ancient languages/history.
 *   - criminology, social-work, some allied-health/agriculture: largely absent.
 */

/** code → subject id(s). Keyed by full CAH level-3 code. */
export const CAH_TO_SUBJECTS: Record<string, string[]> = {
  // CAH01 Medicine & dentistry
  "CAH01-01-01": ["biomedical-sciences"],
  "CAH01-01-02": ["medicine"],
  "CAH01-01-03": ["biomedical-sciences"],
  "CAH01-01-04": ["dentistry"],

  // CAH02 Subjects allied to medicine
  "CAH02-02-01": ["pharmacy"],
  "CAH02-02-03": ["pharmacy"],
  "CAH02-04-01": ["nursing"],
  "CAH02-04-02": ["nursing"],
  "CAH02-04-04": ["nursing"],
  "CAH02-04-05": ["nursing"],
  "CAH02-04-06": ["dentistry"],
  "CAH02-04-07": ["nursing"],
  "CAH02-04-08": ["nursing"],
  "CAH02-05-01": ["biomedical-sciences"],
  "CAH02-05-02": ["biomedical-sciences"],
  "CAH02-05-03": ["biomedical-sciences"],
  "CAH02-05-04": ["biomedical-sciences"],
  "CAH02-06-01": ["biomedical-sciences"],

  // CAH03 Biological & sport sciences
  "CAH03-01-01": ["biology"],
  "CAH03-01-02": ["biology"],
  "CAH03-01-03": ["biology", "environmental-science"],
  "CAH03-01-04": ["biology"],
  "CAH03-01-05": ["biology"],
  "CAH03-01-06": ["biology"],
  "CAH03-01-07": ["biology"],
  "CAH03-01-08": ["biochemistry"],
  "CAH03-01-10": ["biology"],
  "CAH03-02-01": ["sports-science"],

  // CAH04 Psychology
  "CAH04-01-01": ["psychology"],
  "CAH04-01-02": ["psychology"],
  "CAH04-01-03": ["psychology"],
  "CAH04-01-04": ["psychology"],
  "CAH04-01-05": ["neuroscience", "psychology"],

  // CAH05 Veterinary sciences
  "CAH05-01-01": ["veterinary-science"],
  "CAH05-01-02": ["veterinary-science"],

  // CAH06 Agriculture, food & related — mostly no UI subject
  "CAH06-01-01": ["biology"],

  // CAH07 Physical sciences (07-01 physics, 07-02 chemistry)
  "CAH07-01-01": ["physics"],
  "CAH07-01-02": ["physics"],
  "CAH07-02-01": ["chemistry"],

  // CAH09 Mathematical sciences
  "CAH09-01-01": ["mathematics"],
  "CAH09-01-02": ["data-science"],
  "CAH09-01-03": ["mathematics"],

  // CAH10 Engineering (all sub-codes)
  "CAH10-01-01": ["engineering"],
  "CAH10-01-02": ["engineering"],
  "CAH10-01-03": ["engineering"],
  "CAH10-01-04": ["engineering"],
  "CAH10-01-06": ["engineering"],
  "CAH10-01-07": ["engineering"],
  "CAH10-01-08": ["engineering"],
  "CAH10-01-09": ["engineering"],
  "CAH10-01-10": ["engineering"],
  "CAH10-03-02": ["engineering"],
  "CAH10-03-03": ["engineering"],
  "CAH10-03-04": ["engineering"],
  "CAH10-03-05": ["engineering"],
  "CAH10-03-06": ["engineering"],
  "CAH10-03-07": ["engineering"],

  // CAH11 Computing
  "CAH11-01-01": ["computer-science"],
  "CAH11-01-02": ["computer-science"],
  "CAH11-01-03": ["computer-science"],
  "CAH11-01-04": ["computer-science", "data-science"],
  "CAH11-01-05": ["computer-science", "data-science"],
  "CAH11-01-06": ["computer-science"],
  "CAH11-01-07": ["computer-science"],
  "CAH11-01-08": ["computer-science"],

  // CAH13 Architecture, building & planning
  "CAH13-01-01": ["architecture"],
  "CAH13-01-02": ["architecture"],
  "CAH13-01-03": ["architecture"],
  "CAH13-01-04": ["architecture"],

  // CAH15 Social sciences
  "CAH15-01-01": ["sociology"],
  "CAH15-01-02": ["sociology"],
  "CAH15-01-03": ["sociology"],
  "CAH15-01-04": ["sociology"],
  "CAH15-01-05": ["sociology"],
  "CAH15-01-06": ["media-studies"],
  // 15-02 economics; PPE/economics-joint alias here (CAH can't isolate joints)
  "CAH15-02-01": ["economics", "economics-joint", "ppe"],
  // 15-03 politics & international relations; PPE also surfaces here
  "CAH15-03-01": ["politics", "international-relations", "ppe"],
  "CAH15-04-01": ["education", "social-work"],
  "CAH15-04-02": ["education"],

  // CAH16 Law
  "CAH16-01-01": ["law"],

  // CAH17 Business & management
  "CAH17-01-01": ["business", "management"],
  "CAH17-01-02": ["accounting", "finance"],
  "CAH17-01-03": ["business"],
  "CAH17-01-04": ["management"],
  "CAH17-01-05": ["management"],
  "CAH17-01-06": ["business"],
  "CAH17-01-07": ["accounting", "finance"],
  "CAH17-01-08": ["accounting"],
  "CAH17-01-09": ["business"],

  // CAH19 Language & area studies
  "CAH19-01-01": ["english-literature"],
  "CAH19-01-02": ["english-literature"],
  "CAH19-01-03": ["english-literature"],
  "CAH19-01-05": ["english-literature"],
  "CAH19-01-06": ["english-literature"],
  "CAH19-01-07": ["linguistics"],
  "CAH19-02-01": ["modern-languages"],
  "CAH19-02-02": ["modern-languages"],
  "CAH19-02-03": ["modern-languages"],
  "CAH19-02-04": ["modern-languages"],
  "CAH19-04-01": ["modern-languages"],
  "CAH19-04-02": ["modern-languages"],
  "CAH19-04-03": ["modern-languages"],
  "CAH19-04-04": ["modern-languages"],
  "CAH19-04-05": ["modern-languages"],
  "CAH19-04-06": ["modern-languages"],
  "CAH19-04-07": ["modern-languages"],
  "CAH19-04-08": ["modern-languages"],
  // ancient languages — the closest home for classics
  "CAH19-04-09": ["modern-languages", "classics"],

  // CAH20 Historical, philosophical & religious
  "CAH20-01-01": ["history", "classics"],
  "CAH20-01-02": ["art-history"],
  "CAH20-01-03": ["history"],
  "CAH20-01-04": ["history"],
  "CAH20-01-05": ["history"],
  "CAH20-02-01": ["philosophy"],
  "CAH20-02-02": ["theology"],

  // CAH22 Education & teaching
  "CAH22-01-01": ["education"],
  "CAH22-01-02": ["education"],

  // CAH24 Media, journalism & communications
  "CAH24-01-02": ["media-studies"],
  "CAH24-01-04": ["media-studies"],
  "CAH24-01-05": ["media-studies", "film-studies"],

  // CAH25 Design, creative & performing arts
  "CAH25-01-01": ["design"],
  "CAH25-01-02": ["fine-art", "design"],
  "CAH25-01-03": ["design", "fine-art"],
  "CAH25-01-04": ["film-studies", "design"],
  "CAH25-01-05": ["design"],
  "CAH25-02-02": ["music"],
  "CAH25-02-03": ["drama"],

  // CAH26 Geography, earth & environmental
  "CAH26-01-01": ["geography", "environmental-science"],
  "CAH26-01-02": ["environmental-science", "geography"],
  "CAH26-01-03": ["geography"],
  "CAH26-01-04": ["environmental-science", "geography"],
  "CAH26-01-06": ["environmental-science", "geography"],
};

/** subject id → the CAH codes that map to it (reverse index, for querying). */
export const SUBJECT_TO_CAH: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const [code, subjects] of Object.entries(CAH_TO_SUBJECTS)) {
    for (const s of subjects) (out[s] ??= []).push(code);
  }
  return out;
})();

/** The CAH codes to query for a set of ticked subject ids (deduped). */
export function cahCodesForSubjects(subjectIds: string[]): string[] {
  const codes = new Set<string>();
  for (const id of subjectIds) {
    for (const code of SUBJECT_TO_CAH[id] ?? []) codes.add(code);
  }
  return Array.from(codes);
}

/** The subject ids a course carries, from its CAH codes (deduped). */
export function subjectsForCahCodes(codes: string[] | null | undefined): string[] {
  const subjects = new Set<string>();
  for (const code of codes ?? []) {
    for (const s of CAH_TO_SUBJECTS[code] ?? []) subjects.add(s);
  }
  return Array.from(subjects);
}
