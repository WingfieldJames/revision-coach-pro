/**
 * Normalize various spec JSON shapes into a flat string[].
 * Accepts:
 *   - string[]
 *   - { specifications: [...] }
 *   - array of objects with content/point/name/text fields
 *   - nested objects with subtopics / children
 * Returns string[] or null if unusable.
 */
export function normalizeSpecifications(raw: unknown): string[] | null {
  if (!raw) return null;

  // If it's a string, try to parse it
  if (typeof raw === "string") {
    try {
      return normalizeSpecifications(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  // If it has a `specifications` key, unwrap
  if (typeof raw === "object" && !Array.isArray(raw) && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if ("specifications" in obj) return normalizeSpecifications(obj.specifications);
    // Single object with content-like field
    const text = extractText(obj);
    if (text) return [text];
    // Object with topic keys mapping to arrays
    const results: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        const nested = normalizeSpecifications(val);
        if (nested) {
          results.push(...nested.map(p => key && !p.startsWith(key) ? `${key}: ${p}` : p));
        }
      }
    }
    return results.length > 0 ? results : null;
  }

  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return null;

  // Array of strings
  if (raw.every(item => typeof item === "string")) {
    const strings = raw.filter((s: string) => s.trim().length > 0);
    return strings.length > 0 ? strings : null;
  }

  // Array of objects — extract text from each
  const results: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.trim()) results.push(item.trim());
      continue;
    }
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      // Check for nested subtopics/children pattern (Edexcel Maths style)
      const topicName = (obj.topic || obj.name || obj.section || obj.title || "") as string;
      const children = (obj.subtopics || obj.children || obj.points || obj.items || obj.content) as unknown;
      
      if (Array.isArray(children)) {
        const nested = normalizeSpecifications(children);
        if (nested) {
          results.push(...nested.map(p => topicName && !p.startsWith(topicName) ? `${topicName}: ${p}` : p));
          continue;
        }
      }
      
      // Flat object with text field
      const text = extractText(obj);
      if (text) {
        if (topicName && !text.startsWith(topicName)) {
          results.push(`${topicName}: ${text}`);
        } else {
          results.push(text);
        }
      }
    }
  }

  return results.length > 0 ? results : null;
}

function extractText(obj: Record<string, unknown>): string | null {
  for (const key of ["content", "point", "text", "description", "spec", "name"]) {
    if (typeof obj[key] === "string" && (obj[key] as string).trim().length > 0) {
      return (obj[key] as string).trim();
    }
  }
  return null;
}
