import React, { useState } from 'react';
import { Search, FileSearch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface PaperChunk {
  id: string;
  content: string;
  metadata: any;
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
  const [results, setResults] = useState<PaperChunk[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearched(true);

    try {
      // Generate embedding for the query
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (sessionData.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      // Use the match_documents RPC with embedding search
      const embResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: productId,
          query: `Find past paper questions about: ${searchQuery}`,
          search_only: true,
        }),
      });

      // Fallback: do a text-based search on document_chunks
      const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('id, content, metadata')
        .eq('product_id', productId)
        .limit(50);

      if (error || !chunks) {
        setResults([]);
        return;
      }

      // Filter chunks that are past paper related and match query
      const queryLower = searchQuery.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      const paperChunks = chunks.filter((chunk: PaperChunk) => {
        const meta = chunk.metadata || {};
        const contentType = String(meta.content_type || '');
        // Only include paper-related chunks
        const isPaper = contentType.includes('paper') ||
          contentType.includes('combined') ||
          contentType.includes('question') ||
          contentType.includes('mark_scheme');
        if (!isPaper) return false;

        // Check if content matches query
        const contentLower = chunk.content.toLowerCase();
        const matchCount = queryWords.filter(w => contentLower.includes(w)).length;
        return matchCount >= Math.max(1, Math.floor(queryWords.length * 0.4));
      });

      setResults(paperChunks.slice(0, 10));
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

  const getChunkLabel = (chunk: PaperChunk) => {
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

  // Search view
  return (
    <div className="space-y-3">
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={`Enter a topic... e.g. a key concept from ${subjectName}`}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Button
        onClick={handleSearch}
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

      {!searchQuery && (
        <p className="text-xs text-center text-muted-foreground">
          Search through uploaded past papers by topic or keyword
        </p>
      )}
    </div>
  );
};
