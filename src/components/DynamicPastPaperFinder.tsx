import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileSearch, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity?: number;
}

interface SpecPoint {
  id: string;
  content: string;
  topic?: string;
}

interface DynamicPastPaperFinderProps {
  productId: string;
  subjectName?: string;
  tier?: 'free' | 'deluxe';
}

// Normalize question numbers: strip leading zeros, convert dot notation to sub-parts
function normalizeQuestionNumber(qn: string): string {
  if (!qn) return '';
  // Handle "01.3" format -> "1(c)", "02.1" -> "2(a)" etc.
  const dotMatch = qn.match(/^0*(\d+)\.(\d+)$/);
  if (dotMatch) {
    const main = dotMatch[1];
    const sub = parseInt(dotMatch[2], 10);
    const subLetter = String.fromCharCode(96 + sub); // 1->a, 2->b, 3->c
    return `${main}(${subLetter})`;
  }
  // Strip leading zeros from simple numbers
  return qn.replace(/^0+/, '') || qn;
}

// Parse structured data from chunk content/metadata
function parseChunkDisplay(chunk: SearchResult) {
  const meta = chunk.metadata || {};
  const year = meta.year || '';
  const paperNum = meta.paper_number ? `Paper ${meta.paper_number}` : '';
  const section = meta.topic || meta.section || '';
  const marks = meta.total_marks || meta.marks || null;
  const rawQn = meta.question_number || '';
  const questionNum = normalizeQuestionNumber(String(rawQn));

  // Try to extract question text - strip "Question X(Y):" prefix
  let questionText = chunk.content || '';
  
  // Skip mark scheme content entirely
  if (questionText.match(/^Mark Scheme/i)) {
    return { headerLabel: '', marks: null, questionNum: '', questionText: '', extract: '', isMarkScheme: true };
  }

  // Strip mark scheme portion from combined chunks
  const msIndex = questionText.indexOf('Mark Scheme:');
  if (msIndex > 0) {
    questionText = questionText.slice(0, msIndex).trim();
  }
  // Also strip "MS:" style mark scheme sections
  const msIndex2 = questionText.indexOf('\nMS:');
  if (msIndex2 > 0) {
    questionText = questionText.slice(0, msIndex2).trim();
  }

  const prefixMatch = questionText.match(/^Question\s+\d+[a-z]?\s*(\([a-z]+\))?\s*:?\s*/i);
  if (prefixMatch) {
    questionText = questionText.slice(prefixMatch[0].length);
  }

  // Extract figure/context/extract section and preserve it prominently
  let extract = '';
  const contextMatch = questionText.match(/(?:Context|Extract|Source|Figure\s+\d+):\s*([\s\S]*?)(?:\n\n|$)/i);
  if (contextMatch) {
    extract = contextMatch[0].trim();
    questionText = questionText.replace(contextMatch[0], '').trim();
  }
  
  // Also check for inline figure references to highlight
  if (!extract) {
    const figureRef = questionText.match(/((?:Using |See |Refer to )?Figure\s+\d+[^.]*\.)/i);
    if (figureRef) {
      extract = figureRef[1].trim();
    }
  }

  // Build header label
  const headerParts = [paperNum, year ? `June ${year}` : '', section].filter(Boolean);
  const headerLabel = headerParts.length > 0 ? headerParts.join(' • ') : 'Past Paper';

  return { headerLabel, marks, questionNum, questionText: questionText.slice(0, 500), extract, isMarkScheme: false };
}

export const DynamicPastPaperFinder: React.FC<DynamicPastPaperFinderProps> = ({
  productId,
  subjectName = 'this subject',
  tier = 'free',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [specPoints, setSpecPoints] = useState<SpecPoint[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [selectedSpecPoint, setSelectedSpecPoint] = useState<SpecPoint | null>(null);

  // Load spec points on mount
  useEffect(() => {
    const loadSpecs = async () => {
      try {
        const { data, error } = await supabase
          .from('document_chunks')
          .select('id, content, metadata')
          .eq('product_id', productId)
          .limit(200);

        if (error || !data) { setLoadingSpecs(false); return; }

        const specs = data
          .filter((c: any) => {
            const ct = String(c.metadata?.content_type || '');
            return ct === 'specification';
          })
          .map((c: any) => ({
            id: c.id,
            content: c.content,
            topic: c.metadata?.topic || c.content.slice(0, 80),
          }));

        setSpecPoints(specs);
      } catch (err) {
        console.error('Failed to load spec points:', err);
      } finally {
        setLoadingSpecs(false);
      }
    };
    loadSpecs();
  }, [productId]);

  // Filter spec points based on search query - only when typing (not when spec selected)
  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim() || selectedSpecPoint) return [];
    const q = searchQuery.toLowerCase();
    return specPoints.filter(sp => {
      const topic = (sp.topic || '').toLowerCase();
      const content = sp.content.toLowerCase();
      return topic.includes(q) || content.includes(q);
    }).slice(0, 8);
  }, [searchQuery, specPoints, selectedSpecPoint]);

  const handleSearch = async () => {
    const query = selectedSpecPoint
      ? (selectedSpecPoint.topic || selectedSpecPoint.content.slice(0, 80))
      : searchQuery;
    if (!query.trim()) return;

    setSearching(true);
    setShowResults(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (sessionData.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: productId,
          query: `Find past paper questions about: ${query}`,
          search_only: true,
        }),
      });

      if (!resp.ok) {
        setResults([]);
        return;
      }

      let data: any;
      const respText = await resp.text();
      try {
        data = JSON.parse(respText);
      } catch {
        const jsonMatch = respText.match(/\{[\s\S]*\}/);
        data = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [] };
      }
      const chunks: SearchResult[] = (data.results || data.chunks || []);

      const paperTypes = ['paper', 'combined', 'question', 'past_paper', 'past_paper_qp', 'paper_1', 'paper_2', 'paper_3'];
      const paperResults = chunks.filter((c: SearchResult) => {
        const ct = String(c.metadata?.content_type || '');
        const content = (c.content || '').trim();
        // Exclude pure mark scheme chunks
        if (content.match(/^Mark Scheme/i)) return false;
        // Include paper-type chunks or chunks with figure references
        const isPaper = paperTypes.some(t => ct.includes(t));
        const hasFigure = /Figure\s+\d+/i.test(content) || /Figure\s+\d+/i.test(c.metadata?.topic || '');
        return isPaper || hasFigure;
      });

      const maxResults = tier === 'free' ? 5 : 10;
      setResults(paperResults.slice(0, maxResults));
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedSpecPoint(null);
  };

  const handleSpecClick = (sp: SpecPoint) => {
    setSelectedSpecPoint(sp);
    setSearchQuery(sp.topic || sp.content.slice(0, 80));
  };

  // Results view
  if (showResults && !searching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <FileSearch className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Past Paper Finder</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedSpecPoint ? selectedSpecPoint.topic : searchQuery}
            </p>
          </div>
        </div>

        {tier === 'free' && (
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              📚 Free version — showing limited results
            </p>
          </div>
        )}

        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
          {results.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No questions found for this topic.</p>
            </div>
          ) : (
            results.map((chunk) => {
              const { headerLabel, marks, questionNum, questionText, extract, isMarkScheme } = parseChunkDisplay(chunk);
              if (isMarkScheme || !questionText.trim()) return null;
              return (
                <div key={chunk.id} className="border border-border rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-primary">
                      {headerLabel}
                    </span>
                    {marks && (
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {marks} {Number(marks) === 1 ? 'mark' : 'marks'}
                      </span>
                    )}
                  </div>
                  {questionNum && (
                    <p className="text-xs font-semibold text-foreground mb-1">Q{questionNum}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {questionText}
                    {questionText.length >= 500 ? '...' : ''}
                  </p>
                  {extract && (
                    <p className="text-xs text-muted-foreground/70 mt-1.5 italic border-l-2 border-primary/30 pl-2">
                      {extract}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
          Search Another Topic
        </Button>
      </div>
    );
  }

  // Search view — matches legacy PastPaperFinderTool exactly
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <FileSearch className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Past Paper Finder</h3>
          <p className="text-xs text-muted-foreground">
            Search by topic to find past exam questions
          </p>
        </div>
      </div>

      {tier === 'free' && (
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">
            📚 Free version — limited results
          </p>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedSpecPoint(null);
            setShowResults(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && (selectedSpecPoint || searchQuery.trim()) && handleSearch()}
          placeholder={`Enter a topic from ${subjectName}...`}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Spec point suggestions — only when typing, not when selected */}
      {filteredSpecs.length > 0 && !selectedSpecPoint && (
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Select a spec point:</p>
          {filteredSpecs.map((sp) => (
            <button
              key={sp.id}
              onClick={() => handleSpecClick(sp)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="flex-1 min-w-0 text-xs text-muted-foreground line-clamp-2">
                {sp.topic || sp.content.slice(0, 100)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Selected spec point pill */}
      {selectedSpecPoint && (
        <div className="bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="flex-1 min-w-0 text-xs text-foreground line-clamp-2">
            {selectedSpecPoint.topic || selectedSpecPoint.content.slice(0, 100)}
          </span>
          <button
            onClick={() => { setSelectedSpecPoint(null); setSearchQuery(''); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search button */}
      <Button
        onClick={handleSearch}
        disabled={(!selectedSpecPoint && !searchQuery.trim()) || searching}
        className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
        size="sm"
      >
        {searching ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Search Past Papers
          </>
        )}
      </Button>

      {/* Hint text when empty */}
      {!searchQuery && !loadingSpecs && (
        <p className="text-xs text-center text-muted-foreground">
          Try searching for a topic from {subjectName}
        </p>
      )}

      {loadingSpecs && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground ml-2">Loading spec points...</span>
        </div>
      )}
    </div>
  );
};
