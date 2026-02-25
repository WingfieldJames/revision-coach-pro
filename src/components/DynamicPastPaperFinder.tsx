import React, { useState, useEffect } from 'react';
import { Search, FileSearch, Loader2, BookOpen } from 'lucide-react';
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

export const DynamicPastPaperFinder: React.FC<DynamicPastPaperFinderProps> = ({
  productId,
  subjectName = 'this subject',
  tier = 'free',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [specPoints, setSpecPoints] = useState<SpecPoint[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);

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

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setSearching(true);
    setSearched(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (sessionData.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      // Use rag-chat with search_only to get semantic search results
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

      const data = await resp.json();
      const chunks: SearchResult[] = (data.results || data.chunks || []);

      // Filter to only paper/combined chunks
      const paperResults = chunks.filter((c: SearchResult) => {
        const ct = String(c.metadata?.content_type || '');
        return ct.includes('paper') || ct.includes('combined') || ct.includes('question') || ct.includes('mark_scheme');
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
    setSearched(false);
  };

  const getChunkLabel = (chunk: SearchResult) => {
    const meta = chunk.metadata || {};
    const year = meta.year || '';
    const paperNum = meta.paper_number ? `Paper ${meta.paper_number}` : '';
    const docType = String(meta.doc_type || meta.content_type || '').toUpperCase();
    return [year, paperNum, docType].filter(Boolean).join(' • ');
  };

  // Results view
  if (searched && !searching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <FileSearch className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Past Paper Finder</h3>
            <p className="text-xs text-muted-foreground truncate">
              Results for "{searchQuery}"
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
              <p className="text-sm text-muted-foreground">No matching past paper questions found for this topic.</p>
            </div>
          ) : (
            results.map((chunk) => (
              <div key={chunk.id} className="border border-border rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-primary">
                    {getChunkLabel(chunk)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6 whitespace-pre-wrap">
                  {chunk.content.slice(0, 500)}{chunk.content.length > 500 ? '...' : ''}
                </p>
              </div>
            ))
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
          Search Another Topic
        </Button>
      </div>
    );
  }

  // Search view with spec points
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <FileSearch className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Past Paper Finder</h3>
          <p className="text-xs text-muted-foreground">
            Search by topic or select a spec point
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

      {/* Free text search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
          placeholder={`Enter a topic from ${subjectName}...`}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Button
        onClick={() => handleSearch(searchQuery)}
        disabled={!searchQuery.trim() || searching}
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

      {/* Spec points browser */}
      {!searching && specPoints.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">Or browse by spec point:</p>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
            {specPoints.map((sp) => (
              <button
                key={sp.id}
                onClick={() => handleSearch(sp.topic || sp.content.slice(0, 80))}
                className="w-full text-left px-3 py-2 text-xs rounded-md border border-border hover:bg-muted/50 transition-colors line-clamp-2"
              >
                {sp.topic || sp.content.slice(0, 100)}
              </button>
            ))}
          </div>
        </div>
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
