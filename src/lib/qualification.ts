export type QualLevel = 'gcse' | 'alevel';

export function getQualLevel(): QualLevel {
  if (typeof window === 'undefined') return 'alevel';
  const raw = localStorage.getItem('qualification_level');
  return raw === 'gcse' ? 'gcse' : 'alevel';
}

// Ordered low → high so slider index 0 is the lowest grade.
export function getGradeScale(q: QualLevel = getQualLevel()): readonly string[] {
  return q === 'gcse'
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    : ['E', 'D', 'C', 'B', 'A', 'A*'];
}

export function getMaxSubjects(q: QualLevel = getQualLevel()): number {
  return q === 'gcse' ? 11 : 6;
}

export function getDefaultPredictedGrade(q: QualLevel = getQualLevel()): string {
  return q === 'gcse' ? '5' : 'C';
}

export function getDefaultTargetGrade(q: QualLevel = getQualLevel()): string {
  return q === 'gcse' ? '9' : 'A';
}

export function getYearOptions(q: QualLevel = getQualLevel()): string[] {
  return q === 'gcse' ? ['Year 10', 'Year 11'] : ['Year 12', 'Year 13'];
}

export function getDefaultYear(q: QualLevel = getQualLevel()): string {
  return q === 'gcse' ? 'Year 11' : 'Year 13';
}

// Top grade for display in aspirational copy ("get you that ___").
export function getTopGrade(q: QualLevel = getQualLevel()): string {
  return q === 'gcse' ? '9' : 'A*';
}
