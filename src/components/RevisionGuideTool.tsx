import React, { useState, useMemo, useRef } from 'react';
import { Search, BookOpen, ChevronRight, X, FileDown, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

// Unified spec point type
interface SpecPoint {
  code: string;
  name: string;
  keywords: string[];
}

interface ContentOption {
  id: string;
  label: string;
  enabled: boolean;
  locked?: boolean; // greyed out, can't select
}

interface RevisionGuideToolProps {
  board: 'edexcel' | 'aqa' | 'ocr-cs';
  productId?: string;
  tier?: 'free' | 'deluxe';
}

// Match past paper questions to a spec code
function getMatchedPastPapers(
  board: string,
  specCode: string,
  questions: Array<{ paper: string; year: number; number: string; question: string; marks: number; specCodes: string[] }>
): string {
  const matched = questions.filter(q => q.specCodes.includes(specCode));
  if (matched.length === 0) return '';

  return matched
    .map(q => `- **${q.year} ${q.paper} Q${q.number}** (${q.marks} marks): ${q.question}`)
    .join('\n');
}

// Match diagrams to a spec point by keywords
function getMatchedDiagrams(
  specName: string,
  specKeywords: string[],
  diagramList: Array<{ id: string; title: string; keywords: string[]; imagePath: string }>
): Array<{ title: string; imagePath: string }> {
  const searchTerms = [...specKeywords, ...specName.toLowerCase().split(/[\s,()]+/)].filter(w => w.length > 2);

  return diagramList.filter(d => {
    return d.keywords.some(dk => {
      const dkLower = dk.toLowerCase();
      return searchTerms.some(st => dkLower.includes(st) || st.includes(dkLower));
    });
  });
}

const SUPABASE_URL = "https://xoipyycgycmpflfnrlty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXB5eWNneWNtcGZsZm5ybHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzkzMjUsImV4cCI6MjA2OTM1NTMyNX0.pU8Ej1aAvGoAQ6CuVZwvcCvWBxSGo61X16cfQxW7_bI";

export const RevisionGuideTool: React.FC<RevisionGuideToolProps> = ({
  board,
  productId,
  tier = 'free',
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<SpecPoint | null>(null);
  const [specPoints, setSpecPoints] = useState<SpecPoint[]>([]);
  const [specLoaded, setSpecLoaded] = useState(false);
  const [pastQuestions, setPastQuestions] = useState<any[]>([]);
  const [diagramList, setDiagramList] = useState<any[]>([]);
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([
    { id: 'exam_technique', label: 'Exam Technique', enabled: true },
    { id: 'past_papers', label: 'Past Paper Questions', enabled: true },
    { id: 'diagrams', label: 'Diagrams', enabled: true },
    { id: 'application', label: 'Application', enabled: true },
    { id: 'mark_scheme', label: 'Mark Scheme', enabled: false, locked: true },
  ]);
  const [generating, setGenerating] = useState(false);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [matchedDiagrams, setMatchedDiagrams] = useState<Array<{ title: string; imagePath: string }>>([]);
  const guideRef = useRef<HTMLDivElement>(null);

  // Load spec points, past papers, and diagrams on mount
  React.useEffect(() => {
    const loadData = async () => {
      if (board === 'ocr-cs') {
        const { OCR_CS_SPEC_POINTS, OCR_CS_PAST_QUESTIONS } = await import('@/data/ocrCsPastPapers');
        setSpecPoints(OCR_CS_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
        setPastQuestions(OCR_CS_PAST_QUESTIONS);
        const { csDiagrams } = await import('@/data/csDiagrams');
        setDiagramList(csDiagrams);
      } else if (board === 'aqa') {
        const { AQA_SPEC_POINTS } = await import('@/data/aqaPastPapers');
        setSpecPoints(AQA_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
        const { diagrams } = await import('@/data/diagrams');
        setDiagramList(diagrams);
      } else {
        const { EDEXCEL_SPEC_POINTS } = await import('@/data/edexcelPastPapers');
        setSpecPoints(EDEXCEL_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
        const { diagrams } = await import('@/data/diagrams');
        setDiagramList(diagrams);
      }
      setSpecLoaded(true);
    };
    loadData();
  }, [board]);

  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return specPoints.filter(spec => {
      const nameMatch = spec.name.toLowerCase().includes(query);
      const codeMatch = spec.code.toLowerCase().includes(query);
      const keywordMatch = spec.keywords.some(kw => kw.includes(query));
      return nameMatch || codeMatch || keywordMatch;
    }).slice(0, 8);
  }, [searchQuery, specPoints]);

  const toggleOption = (id: string) => {
    setContentOptions(prev => prev.map(opt =>
      opt.id === id && !opt.locked ? { ...opt, enabled: !opt.enabled } : opt
    ));
  };

  const enabledOptions = contentOptions.filter(o => o.enabled && !o.locked);

  const handleGenerate = async () => {
    if (!selectedSpec || !productId) return;

    setGenerating(true);
    setGuideContent(null);

    try {
      // Client-side: match past papers to this spec code
      const pastPaperContext = contentOptions.find(o => o.id === 'past_papers')?.enabled
        ? getMatchedPastPapers(board, selectedSpec.code, pastQuestions)
        : '';

      // Client-side: match diagrams to this spec point
      const matched = contentOptions.find(o => o.id === 'diagrams')?.enabled
        ? getMatchedDiagrams(selectedSpec.name, selectedSpec.keywords, diagramList)
        : [];
      setMatchedDiagrams(matched);

      const diagramContext = matched.length > 0
        ? matched.map(d => `- ${d.title} (available as diagram image)`).join('\n')
        : '';

      // Get auth token
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      };
      if (sessionData.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-revision-guide`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: productId,
          spec_code: selectedSpec.code,
          spec_name: selectedSpec.name,
          board,
          options: enabledOptions.map(o => o.id),
          past_paper_context: pastPaperContext,
          diagram_context: diagramContext,
          user_id: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error(errorData.message || 'Rate limit reached. Try again later.');
          return;
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setGuideContent(data.content || 'Unable to generate guide. Please try again.');
    } catch (err) {
      console.error('Error generating guide:', err);
      toast.error('Failed to generate revision guide. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!guideContent || !guideRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download the guide');
      return;
    }

    // Build diagram images HTML
    const diagramImagesHtml = matchedDiagrams.length > 0
      ? `<div class="diagrams-section">
          <h2>📊 Relevant Diagrams</h2>
          ${matchedDiagrams.map(d => `
            <div class="diagram-card">
              <h3>${d.title}</h3>
              <img src="${window.location.origin}${d.imagePath}" alt="${d.title}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />
            </div>
          `).join('')}
        </div>`
      : '';

    const boardLabel = board === 'ocr-cs' ? 'OCR A Level Computer Science' : board === 'aqa' ? 'AQA A Level Economics' : 'Edexcel A Level Economics';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revision Guide - ${selectedSpec?.code}: ${selectedSpec?.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; margin: 0 auto; padding: 40px 20px; 
            color: #1a1a1a; line-height: 1.7; background: #fff;
          }
          .header-bar {
            background: linear-gradient(135deg, #9333EA, #7C3AED, #6D28D9, #A855F7);
            height: 6px; border-radius: 3px; margin-bottom: 24px;
          }
          .header { text-align: center; margin-bottom: 32px; }
          .header img { height: 40px; margin-bottom: 12px; }
          .header h1 { 
            color: #6D28D9; font-size: 22px; margin: 0 0 4px 0;
          }
          .header .board-label { 
            color: #7C3AED; font-size: 14px; font-weight: 500; margin: 0 0 4px 0; 
          }
          .header .subtitle { color: #6b7280; font-size: 12px; margin: 0; }
          h2 { 
            color: #6D28D9; margin-top: 32px; font-size: 18px; 
            border-bottom: 2px solid #E9D5FF; padding-bottom: 6px;
          }
          h3 { color: #7C3AED; font-size: 15px; margin-top: 20px; }
          h4 { color: #5b21b6; font-size: 14px; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 4px; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
          blockquote { border-left: 4px solid #7C3AED; margin-left: 0; padding-left: 16px; color: #4b5563; }
          strong { color: #1e1b4b; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f3e8ff; color: #5b21b6; font-weight: 600; }
          .diagram-card { margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .diagram-card h3 { margin-top: 0; font-size: 14px; }
          .footer { 
            text-align: center; margin-top: 48px; padding-top: 20px; 
            border-top: 2px solid #E9D5FF; color: #9ca3af; font-size: 11px; 
          }
          @media print { 
            body { padding: 20px; } 
            .diagram-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header-bar"></div>
        <div class="header">
          <img src="${window.location.origin}/lovable-uploads/deluxe-assistant-new.png" alt="A* AI" onerror="this.style.display='none'" />
          <p class="board-label">${boardLabel}</p>
          <h1>${selectedSpec?.code}: ${selectedSpec?.name}</h1>
          <p class="subtitle">Revision Guide • Generated by A* AI</p>
        </div>
        ${guideRef.current.innerHTML}
        ${diagramImagesHtml}
        <div class="footer">
          <div class="header-bar" style="margin-bottom: 12px;"></div>
          <p>Generated by A* AI • astarai.co.uk</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleReset = () => {
    setGuideContent(null);
    setSelectedSpec(null);
    setSearchQuery('');
    setMatchedDiagrams([]);
  };

  const boardLabel = board === 'ocr-cs' ? 'OCR CS' : board === 'aqa' ? 'AQA' : 'Edexcel';

  // Generated guide view
  if (guideContent) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Revision Guide</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedSpec?.code}: {selectedSpec?.name}
            </p>
          </div>
        </div>

        <div ref={guideRef} className="max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert text-foreground pr-1">
          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {guideContent}
          </ReactMarkdown>
        </div>

        {/* Show matched diagrams inline */}
        {matchedDiagrams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">📊 Relevant Diagrams</p>
            {matchedDiagrams.map((d, i) => (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <img src={d.imagePath} alt={d.title} className="w-full h-auto" />
                <p className="text-xs text-center py-1 text-muted-foreground">{d.title}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
            <FileDown className="w-4 h-4 mr-1.5" />
            Download / Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
            New Guide
          </Button>
        </div>
      </div>
    );
  }

  // Search & options view
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{boardLabel} Revision Guide</h3>
          <p className="text-xs text-muted-foreground">
            Generate a topic-specific revision guide
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedSpec(null);
          }}
          placeholder="Search a topic or spec point..."
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Spec point suggestions */}
      {filteredSpecs.length > 0 && !selectedSpec && (
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Select a spec point:</p>
          {filteredSpecs.map((spec) => (
            <button
              key={spec.code}
              onClick={() => { setSelectedSpec(spec); setSearchQuery(spec.name); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-primary">{spec.code}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{spec.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Selected spec */}
      {selectedSpec && (
        <>
          <div className="bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-primary">{selectedSpec.code}</span>
              <span className="text-xs text-foreground ml-1.5">{selectedSpec.name}</span>
            </div>
            <button
              onClick={() => { setSelectedSpec(null); setSearchQuery(''); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Content options */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Include in guide:</p>
            <div className="flex flex-wrap gap-2">
              {contentOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  disabled={opt.locked}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    opt.locked
                      ? 'bg-muted/50 text-muted-foreground/50 border border-border/50 cursor-not-allowed'
                      : opt.enabled
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground border border-border line-through'
                  }`}
                >
                  {opt.locked && <Lock className="w-3 h-3" />}
                  {opt.label}
                  {opt.locked && <span className="text-[10px] opacity-60">(Coming soon)</span>}
                  {opt.enabled && !opt.locked && (
                    <X className="w-3 h-3 hover:text-destructive" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={!selectedSpec || generating}
        className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
        size="sm"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Guide...
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4 mr-2" />
            Generate Revision Guide
          </>
        )}
      </Button>

      {!searchQuery && (
        <p className="text-xs text-center text-muted-foreground">
          Search for a topic to generate your personalised revision guide
        </p>
      )}
    </div>
  );
};
