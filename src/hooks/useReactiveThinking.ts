import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pickThinkingSources, type PoolItem } from '@/lib/thinkingMatcher';

// Module-level cache: productId -> pool
const poolCache = new Map<string, PoolItem[]>();

const TYPE_LABEL: Record<string, string> = {
  specification: 'Specification',
  past_paper: 'Past Paper',
  past_paper_qp: 'Past Paper Question',
  past_paper_ms: 'Mark Scheme',
  paper_1: 'Paper 1',
  paper_2: 'Paper 2',
  paper_3: 'Paper 3',
  diagram: 'Diagram',
  system_prompt: 'Tutor Notes',
};

const formatType = (t: string) => TYPE_LABEL[t] || t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const buildLabel = (topic: string, type: string, subjectName: string): string => {
  const tStr = (topic || '').trim();
  const friendly = formatType(type);
  if (!tStr) return `${subjectName} ${friendly}`;
  return `${tStr} — ${friendly}`;
};

interface DiagramLibraryEntry {
  title?: string;
  name?: string;
}

/**
 * Returns up to N source pool items relevant to the prompt for the reactive thinking UI.
 * - Caches per productId at module level
 * - Combines document_chunks topics + trainer_projects.diagram_library
 * - Always anchors with "{Subject} Specification" first
 */
export function useReactiveThinking(
  productId: string | undefined,
  subjectName: string,
  enabled: boolean,
) {
  const [pool, setPool] = useState<PoolItem[]>([]);
  const inflightRef = useRef<Promise<PoolItem[]> | null>(null);

  useEffect(() => {
    if (!enabled || !productId) return;
    const cached = poolCache.get(productId);
    if (cached) {
      setPool(cached);
      return;
    }
    if (inflightRef.current) return;

    inflightRef.current = (async () => {
      try {
        // Pull topics from chunks
        const { data: chunks } = await supabase
          .from('document_chunks')
          .select('metadata')
          .eq('product_id', productId)
          .limit(1000);

        const counts = new Map<string, { type: string; topic: string; n: number }>();
        for (const row of chunks || []) {
          const md = (row.metadata as Record<string, unknown>) || {};
          const type = String(md.content_type || 'general');
          const topic = String(md.topic || '').trim();
          const key = `${type}::${topic.toLowerCase()}`;
          const ex = counts.get(key);
          if (ex) ex.n++;
          else counts.set(key, { type, topic, n: 1 });
        }

        // Pull diagram_library from trainer_projects
        const { data: trainer } = await supabase
          .from('trainer_projects')
          .select('diagram_library')
          .eq('product_id', productId)
          .maybeSingle();

        const lib = (trainer?.diagram_library as DiagramLibraryEntry[] | null) || [];
        for (const d of lib) {
          const title = (d?.title || d?.name || '').trim();
          if (!title) continue;
          counts.set(`diagram::${title.toLowerCase()}`, { type: 'diagram', topic: title, n: 1 });
        }

        const items: PoolItem[] = Array.from(counts.values()).map(c => ({
          type: c.type,
          topic: c.topic,
          label: buildLabel(c.topic, c.type, subjectName),
          weight: c.n,
        }));

        poolCache.set(productId, items);
        setPool(items);
        return items;
      } catch (e) {
        console.error('[useReactiveThinking] pool fetch failed', e);
        return [];
      } finally {
        inflightRef.current = null;
      }
    })();
  }, [productId, subjectName, enabled]);

  const getSequence = useCallback((prompt: string, count = 4): PoolItem[] => {
    const anchor: PoolItem = {
      type: 'specification',
      topic: '',
      label: `${subjectName} Specification`,
      weight: 999,
    };
    const matched = pickThinkingSources(prompt, pool, count);
    // Ensure spec anchor is first, dedupe by label
    const seen = new Set<string>([anchor.label.toLowerCase()]);
    const rest = matched.filter(m => {
      const k = m.label.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return [anchor, ...rest].slice(0, count);
  }, [pool, subjectName]);

  return { getSequence, poolReady: pool.length > 0 };
}
