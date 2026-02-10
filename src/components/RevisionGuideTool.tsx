import React, { useState, useMemo, useRef } from 'react';
import { Search, BookOpen, ChevronRight, X, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
}

interface RevisionGuideToolProps {
  board: 'edexcel' | 'aqa' | 'ocr-cs';
  productId?: string;
  tier?: 'free' | 'deluxe';
}

// Lazy imports for spec points
function getSpecPoints(board: 'edexcel' | 'aqa' | 'ocr-cs'): SpecPoint[] {
  // We'll import dynamically based on board
  return [];
}

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
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([
    { id: 'exam_technique', label: 'Exam Technique', enabled: true },
    { id: 'past_papers', label: 'Past Paper Questions', enabled: true },
    { id: 'diagrams', label: 'Diagrams', enabled: true },
    { id: 'application', label: 'Application', enabled: true },
    { id: 'mark_scheme', label: 'Mark Scheme', enabled: true },
  ]);
  const [generating, setGenerating] = useState(false);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  // Load spec points on mount
  React.useEffect(() => {
    const loadSpecs = async () => {
      if (board === 'ocr-cs') {
        const { OCR_CS_SPEC_POINTS } = await import('@/data/ocrCsPastPapers');
        setSpecPoints(OCR_CS_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
      } else if (board === 'aqa') {
        const { AQA_SPEC_POINTS } = await import('@/data/aqaPastPapers');
        setSpecPoints(AQA_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
      } else {
        const { EDEXCEL_SPEC_POINTS } = await import('@/data/edexcelPastPapers');
        setSpecPoints(EDEXCEL_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords })));
      }
      setSpecLoaded(true);
    };
    loadSpecs();
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
      opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
    ));
  };

  const enabledOptions = contentOptions.filter(o => o.enabled);

  const handleGenerate = async () => {
    if (!selectedSpec || !productId) return;

    setGenerating(true);
    setGuideContent(null);

    try {
      const optionLabels = enabledOptions.map(o => o.label).join(', ');
      const prompt = `Generate a comprehensive revision guide for spec point ${selectedSpec.code}: ${selectedSpec.name}.

This guide should be structured as a complete study resource covering this specific topic. Include the following sections:

1. **Key Knowledge** (MANDATORY) - Cover every detail of this spec point systematically. Use clear definitions, explanations, and examples.

${enabledOptions.some(o => o.id === 'exam_technique') ? '2. **Exam Technique** - How to answer questions on this topic. Include command word tips, common pitfalls, and mark scheme expectations.' : ''}

${enabledOptions.some(o => o.id === 'past_papers') ? '3. **Past Paper Questions** - List any relevant past paper questions from your training data that relate to this topic. Include the year and marks available.' : ''}

${enabledOptions.some(o => o.id === 'diagrams') ? '4. **Diagrams** - Describe any relevant diagrams for this topic. Explain what should be drawn and labelled.' : ''}

${enabledOptions.some(o => o.id === 'application') ? '5. **Real-World Application** - Provide real-world examples and case studies that demonstrate this concept in practice.' : ''}

${enabledOptions.some(o => o.id === 'mark_scheme') ? '6. **Mark Scheme Pointers** - Key phrases and points that examiners look for. Include typical mark allocation breakdowns.' : ''}

Format using clear markdown headings and bullet points. Be thorough and detailed.`;

      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionData.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('rag-chat', {
        headers,
        body: {
          message: prompt,
          product_id: productId,
          user_id: user?.id,
          tier: tier,
          history: [],
        },
      });

      if (error) throw error;

      setGuideContent(data?.reply || data?.response || 'Unable to generate guide. Please try again.');
    } catch (err) {
      console.error('Error generating guide:', err);
      toast.error('Failed to generate revision guide');
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revision Guide - ${selectedSpec?.code}: ${selectedSpec?.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6; }
          h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 8px; font-size: 24px; }
          h2 { color: #6d28d9; margin-top: 28px; font-size: 20px; }
          h3 { color: #5b21b6; font-size: 16px; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 4px; }
          code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
          pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
          blockquote { border-left: 4px solid #7c3aed; margin-left: 0; padding-left: 16px; color: #4b5563; }
          strong { color: #1e1b4b; }
          .header { text-align: center; margin-bottom: 32px; }
          .header p { color: #6b7280; font-size: 14px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 Revision Guide</h1>
          <p>${selectedSpec?.code}: ${selectedSpec?.name}</p>
          <p>Generated by A* AI</p>
        </div>
        ${guideRef.current.innerHTML}
        <div class="footer">
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
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {guideContent}
          </ReactMarkdown>
        </div>

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
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    opt.enabled
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground border border-border line-through'
                  }`}
                >
                  {opt.label}
                  {opt.enabled && (
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
