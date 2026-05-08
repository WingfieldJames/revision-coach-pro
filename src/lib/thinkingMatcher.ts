// Lightweight keyword matcher for the reactive "thinking" UI.
// Mirrors Past Paper Finder stop-word strategy with 2x boost on exact word matches.

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','if','so','because','as','of','at','by','for','with','about','against',
  'between','into','through','during','before','after','above','below','to','from','up','down','in','out',
  'on','off','over','under','again','further','then','once','here','there','when','where','why','how','all',
  'any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','than',
  'too','very','can','will','just','dont','should','now','i','me','my','we','our','you','your','he','she',
  'it','they','them','this','that','these','those','am','is','are','was','were','be','been','being','have',
  'has','had','do','does','did','what','which','who','whom','please','explain','describe','tell','give','show',
]);

export interface PoolItem {
  type: string;
  topic: string;
  /** Pre-computed display label */
  label: string;
  /** Frequency in source pool — used as fallback ordering */
  weight: number;
}

const tokenize = (text: string): string[] =>
  (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Score each pool item against the prompt tokens.
 * Returns top N, deduped by normalised label, with a balanced mix of content types.
 */
export function pickThinkingSources(
  prompt: string,
  pool: PoolItem[],
  count = 4,
): PoolItem[] {
  if (!pool.length) return [];
  const tokens = tokenize(prompt);

  const scored = pool.map(item => {
    const haystack = norm(`${item.topic} ${item.type}`);
    let score = 0;
    for (const tok of tokens) {
      if (!haystack.includes(tok)) continue;
      // 2x boost for word-boundary match
      const re = new RegExp(`\\b${tok}\\b`);
      score += re.test(haystack) ? 2 : 1;
    }
    return { item, score };
  });

  const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  // Fallback: if zero matches, use most common topics
  const ordered = matched.length
    ? matched.map(s => s.item)
    : [...pool].sort((a, b) => b.weight - a.weight);

  // Dedupe by normalised label and balance types
  const seen = new Set<string>();
  const byType = new Map<string, number>();
  const out: PoolItem[] = [];
  for (const it of ordered) {
    const key = norm(it.label);
    if (seen.has(key)) continue;
    const tCount = byType.get(it.type) || 0;
    if (tCount >= 2 && out.length >= count - 1) continue; // soft cap per type
    seen.add(key);
    byType.set(it.type, tCount + 1);
    out.push(it);
    if (out.length >= count) break;
  }
  return out;
}

export { tokenize };
