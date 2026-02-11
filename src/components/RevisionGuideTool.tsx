import React, { useState, useMemo, useRef } from 'react';
import { Search, BookOpen, ChevronRight, X, FileDown, Loader2, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import logoLight from '@/assets/a-star-icon-light.png';

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
  locked?: boolean;
}

interface RevisionGuideToolProps {
  board: 'edexcel' | 'aqa' | 'ocr-cs';
  productId?: string;
  tier?: 'free' | 'deluxe';
}

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
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXB5eWNneWNtcGZsZm5ybHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzkzMjUsImV4cCI6MjA2OTM1NTMyNX0.pU8Ej1aAvGoAQ6CuVZwvcCvWBxSGo61X-16cfQxW7_bI";

const BOARD_LABELS: Record<string, string> = {
  'ocr-cs': 'OCR A Level Computer Science (H446)',
  'aqa': 'AQA A Level Economics',
  'edexcel': 'Edexcel A Level Economics',
};

// Render markdown content with inline diagram support
const GuideMarkdown: React.FC<{ content: string; diagrams: Array<{ title: string; imagePath: string }> }> = ({ content, diagrams }) => {
  // Replace [DIAGRAM: title] placeholders with actual images
  const processedContent = content.replace(/\[DIAGRAM:\s*(.+?)\]/g, (match, title) => {
    const diagram = diagrams.find(d => d.title.toLowerCase().includes(title.toLowerCase().trim()) || title.toLowerCase().trim().includes(d.title.toLowerCase()));
    if (diagram) {
      return `\n\n![${diagram.title}](${diagram.imagePath})\n*${diagram.title}*\n\n`;
    }
    return '';
  });

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        img: ({ src, alt }) => (
          <div className="my-4 flex flex-col items-center">
            <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg border border-gray-200" style={{ maxHeight: '300px' }} />
            {alt && <p className="text-xs text-gray-500 mt-1 italic">{alt}</p>}
          </div>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

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
  const [viewMode, setViewMode] = useState<'buttons' | 'view'>('buttons');
  const guideRef = useRef<HTMLDivElement>(null);

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
    setViewMode('buttons');

    try {
      const pastPaperContext = contentOptions.find(o => o.id === 'past_papers')?.enabled
        ? getMatchedPastPapers(board, selectedSpec.code, pastQuestions)
        : '';

      const matched = contentOptions.find(o => o.id === 'diagrams')?.enabled
        ? getMatchedDiagrams(selectedSpec.name, selectedSpec.keywords, diagramList)
        : [];
      setMatchedDiagrams(matched);

      const diagramContext = matched.length > 0
        ? matched.map(d => `- ${d.title} (available as diagram image)`).join('\n')
        : '';

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
    if (!guideContent || !selectedSpec) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download the guide');
      return;
    }

    const boardLabel = BOARD_LABELS[board] || board;

    // Process diagram placeholders for print
    let printContent = guideContent.replace(/\[DIAGRAM:\s*(.+?)\]/g, (match, title) => {
      const diagram = matchedDiagrams.find(d =>
        d.title.toLowerCase().includes(title.toLowerCase().trim()) ||
        title.toLowerCase().trim().includes(d.title.toLowerCase())
      );
      if (diagram) {
        return `<div class="diagram-inline"><img src="${window.location.origin}${diagram.imagePath}" alt="${diagram.title}" /><p class="diagram-caption">${diagram.title}</p></div>`;
      }
      return '';
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revision Guide - ${selectedSpec.code}: ${selectedSpec.name}</title>
        <style>
          @page { size: A4; margin: 20mm 25mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            color: #1a1a1a; line-height: 1.7; background: #fff;
            max-width: 210mm; margin: 0 auto; padding: 20mm 25mm;
          }
          .logo { height: 36px; margin-bottom: 8px; }
          .main-title {
            font-size: 22px; font-weight: 700; color: #1a1a1a;
            margin-bottom: 4px;
          }
          .spec-title {
            font-size: 17px; font-weight: 700; color: #1a1a1a;
            margin-bottom: 16px; padding-bottom: 12px;
            border-bottom: 3px solid #7C3AED;
          }
          .generated-by { font-size: 11px; color: #9ca3af; margin-bottom: 20px; }
          h2 {
            font-size: 17px; font-weight: 700; color: #5b21b6;
            margin-top: 28px; margin-bottom: 12px;
            padding-bottom: 6px; border-bottom: 2px solid #E9D5FF;
          }
          h3 { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-top: 20px; margin-bottom: 8px; }
          h4 { font-size: 13px; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 6px; }
          p { margin-bottom: 8px; font-size: 13px; }
          ul, ol { padding-left: 24px; margin-bottom: 10px; }
          li { margin-bottom: 4px; font-size: 13px; }
          strong { color: #1e1b4b; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          pre { background: #f3f4f6; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
          blockquote { border-left: 4px solid #7C3AED; margin: 10px 0; padding-left: 14px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background: #f3e8ff; color: #5b21b6; font-weight: 600; }
          .diagram-inline { margin: 14px 0; text-align: center; }
          .diagram-inline img { max-width: 80%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
          .diagram-caption { font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic; }
          .footer {
            text-align: center; margin-top: 40px; padding-top: 16px;
            border-top: 2px solid #E9D5FF; font-size: 11px; color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .diagram-inline { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <img src="${window.location.origin}/lovable-uploads/deluxe-assistant-new.png" alt="A* AI" class="logo" onerror="this.style.display='none'" />
        <div class="main-title">${boardLabel}</div>
        <div class="spec-title">${selectedSpec.code}: ${selectedSpec.name}</div>
        <div class="generated-by">Revision Guide &middot; Generated by A* AI</div>
        <div id="content">${printContent}</div>
        <div class="footer">
          <p>Generated by A* AI &middot; astarai.co.uk</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // Convert markdown to HTML for print using a simple approach
    import('react-dom/server').then(({ renderToString }) => {
      const React = require('react');
      // For the print window, we already have the content - trigger print
      setTimeout(() => printWindow.print(), 600);
    }).catch(() => {
      setTimeout(() => printWindow.print(), 600);
    });
  };

  const handleReset = () => {
    setGuideContent(null);
    setSelectedSpec(null);
    setSearchQuery('');
    setMatchedDiagrams([]);
    setViewMode('buttons');
  };

  const boardLabel = BOARD_LABELS[board] || board;
  const shortBoardLabel = board === 'ocr-cs' ? 'OCR CS' : board === 'aqa' ? 'AQA' : 'Edexcel';

  // Full-screen A4 view
  if (guideContent && viewMode === 'view') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto flex justify-center py-8 px-4" onClick={() => setViewMode('buttons')}>
        <div className="w-full max-w-[210mm] relative" onClick={e => e.stopPropagation()}>
          {/* Close / back button */}
          <div className="flex justify-end mb-3 gap-2 sticky top-0 z-10">
            <Button variant="outline" size="sm" onClick={handleDownload} className="bg-white text-foreground shadow-md">
              <FileDown className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('buttons')} className="bg-white text-foreground shadow-md">
              <X className="w-4 h-4 mr-1.5" />
              Close
            </Button>
          </div>

          {/* A4 pages */}
          <div
            ref={guideRef}
            className="bg-white text-gray-900 shadow-2xl rounded-sm"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm 25mm',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              lineHeight: 1.7,
              fontSize: '13px',
            }}
          >
            {/* Logo top-left */}
            <img
              src="/lovable-uploads/deluxe-assistant-new.png"
              alt="A* AI"
              style={{ height: '36px', marginBottom: '8px' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            {/* Main title */}
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
              {boardLabel}
            </h1>

            {/* Spec point */}
            <h2 style={{
              fontSize: '17px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '3px solid #7C3AED',
            }}>
              {selectedSpec?.code}: {selectedSpec?.name}
            </h2>

            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '20px' }}>
              Revision Guide &middot; Generated by A* AI
            </p>

            {/* Guide content */}
            <div className="prose prose-sm max-w-none
              [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-purple-800 [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:pb-1.5 [&_h2]:border-b-2 [&_h2]:border-purple-200
              [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2
              [&_h4]:text-[13px] [&_h4]:font-semibold [&_h4]:text-gray-700 [&_h4]:mt-3.5 [&_h4]:mb-1.5
              [&_p]:text-[13px] [&_p]:text-gray-800 [&_p]:mb-2
              [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:text-[13px] [&_li]:text-gray-800 [&_li]:mb-1
              [&_strong]:text-gray-950
              [&_blockquote]:border-l-4 [&_blockquote]:border-purple-500 [&_blockquote]:pl-3.5 [&_blockquote]:text-gray-600
              [&_table]:w-full [&_table]:border-collapse [&_th]:bg-purple-50 [&_th]:text-purple-800 [&_th]:font-semibold [&_th]:border [&_th]:border-gray-200 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-xs [&_td]:border [&_td]:border-gray-200 [&_td]:px-2.5 [&_td]:py-2 [&_td]:text-xs
              [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
              [&_pre]:bg-gray-100 [&_pre]:p-3.5 [&_pre]:rounded-lg [&_pre]:overflow-x-auto
            ">
              <GuideMarkdown content={guideContent} diagrams={matchedDiagrams} />
            </div>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '40px',
              paddingTop: '16px',
              borderTop: '2px solid #E9D5FF',
              fontSize: '11px',
              color: '#9ca3af',
            }}>
              Generated by A* AI &middot; astarai.co.uk
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Button selection view (after generation)
  if (guideContent && viewMode === 'buttons') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Revision Guide Ready</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedSpec?.code}: {selectedSpec?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => setViewMode('view')} className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Here
          </Button>
          <Button variant="outline" onClick={handleDownload} className="w-full" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-muted-foreground text-xs">
          Generate New Guide
        </Button>
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
          <h3 className="font-semibold text-foreground">{shortBoardLabel} Revision Guide</h3>
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
