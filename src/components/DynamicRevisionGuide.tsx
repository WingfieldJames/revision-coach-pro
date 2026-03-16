import React, { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { Search, BookOpen, ChevronRight, X, FileDown, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import logoLight from '@/assets/a-star-icon-light.png';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SpecPoint {
  id: string;
  code: string;
  name: string;
  content: string;
  keywords: string[];
}

interface ContentOption {
  id: string;
  label: string;
  enabled: boolean;
  locked?: boolean;
}

interface DynamicRevisionGuideProps {
  productId: string;
  subjectName?: string;
  tier?: 'free' | 'deluxe';
}

// Render markdown with inline diagram support
const GuideMarkdown: React.FC<{ content: string; diagrams: Array<{ title: string; imagePath: string }> }> = ({ content, diagrams }) => {
  const processedContent = content.replace(/\[DIAGRAM:\s*(.+?)\]/g, (match, title) => {
    const diagram = diagrams.find(d =>
      d.title.toLowerCase().includes(title.toLowerCase().trim()) ||
      title.toLowerCase().trim().includes(d.title.toLowerCase())
    );
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
            <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg border border-border" style={{ maxHeight: '300px' }} />
            {alt && <p className="text-xs text-muted-foreground mt-1 italic">{alt}</p>}
          </div>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

export const DynamicRevisionGuide: React.FC<DynamicRevisionGuideProps> = ({
  productId,
  subjectName = 'this subject',
  tier = 'free',
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<SpecPoint | null>(null);
  const [specPoints, setSpecPoints] = useState<SpecPoint[]>([]);
  const [specLoaded, setSpecLoaded] = useState(false);
  const [diagramList, setDiagramList] = useState<Array<{ title: string; imagePath: string; keywords: string[] }>>([]);
  const [hasDiagrams, setHasDiagrams] = useState(false);
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([]);
  const [generating, setGenerating] = useState(false);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [matchedDiagrams, setMatchedDiagrams] = useState<Array<{ title: string; imagePath: string }>>([]);
  const guideRef = useRef<HTMLDivElement>(null);

  // Load spec points and diagram library from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load spec points from document_chunks
        const { data: chunks } = await supabase
          .from('document_chunks')
          .select('id, content, metadata')
          .eq('product_id', productId)
          .limit(300);

        if (chunks) {
          const specs = chunks
            .filter((c: any) => String(c.metadata?.content_type || '') === 'specification')
            .map((c: any) => {
              const topic = String(c.metadata?.topic || '');
              const specId = String(c.metadata?.spec_id || '');
              // Extract code and name from topic like "3.1.1 Atomic Structure" or "1.1.1 Economics as a social science: ..."
              const codeMatch = topic.match(/^([\d.]+)\s+(.+)/);
              const code = codeMatch ? codeMatch[1] : specId || '';
              const name = codeMatch ? `${codeMatch[1]} ${codeMatch[2]}` : topic || c.content.slice(0, 80);
              // Build keywords from content
              const keywords = (c.content || '').toLowerCase()
                .split(/[\s,()[\]:;.]+/)
                .filter((w: string) => w.length > 3)
                .slice(0, 20);
              return { id: c.id, code, name, content: c.content, keywords };
            });
          setSpecPoints(specs);
        }

        // Load diagram library from trainer_projects
        const { data: trainerData } = await supabase
          .from('trainer_projects')
          .select('diagram_library')
          .eq('product_id', productId)
          .limit(1);

        if (trainerData?.[0]?.diagram_library) {
          const diagrams = (trainerData[0].diagram_library as any[]).map((d: any) => ({
            title: d.title || d.name || '',
            imagePath: d.imagePath || d.image_path || d.url || '',
            keywords: d.keywords || [],
          })).filter(d => d.title && d.imagePath);
          setDiagramList(diagrams);
          setHasDiagrams(diagrams.length > 0);
        }
      } catch (err) {
        console.error('Failed to load revision guide data:', err);
      } finally {
        setSpecLoaded(true);
      }
    };
    loadData();
  }, [productId]);

  // Initialize content options once we know about diagrams
  useEffect(() => {
    if (!specLoaded) return;
    setContentOptions([
      { id: 'exam_technique', label: 'Exam Technique', enabled: true },
      { id: 'past_papers', label: 'Past Paper Questions', enabled: true },
      ...(hasDiagrams ? [{ id: 'diagrams', label: 'Diagrams', enabled: true }] : []),
      { id: 'application', label: 'Application', enabled: true },
      { id: 'mark_scheme', label: 'Mark Scheme', enabled: false, locked: true },
    ]);
  }, [specLoaded, hasDiagrams]);

  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim() || selectedSpec) return [];
    const q = searchQuery.toLowerCase();
    return specPoints.filter(sp => {
      const nameMatch = sp.name.toLowerCase().includes(q);
      const codeMatch = sp.code.toLowerCase().includes(q);
      const keywordMatch = sp.keywords.some(kw => kw.includes(q));
      return nameMatch || codeMatch || keywordMatch;
    }).slice(0, 8);
  }, [searchQuery, specPoints, selectedSpec]);

  const toggleOption = (id: string) => {
    setContentOptions(prev => prev.map(opt =>
      opt.id === id && !opt.locked ? { ...opt, enabled: !opt.enabled } : opt
    ));
  };

  const enabledOptions = contentOptions.filter(o => o.enabled && !o.locked);

  // Match diagrams to selected spec
  const getMatchedDiagrams = (spec: SpecPoint) => {
    if (diagramList.length === 0) return [];
    const searchTerms = [...spec.keywords, ...spec.name.toLowerCase().split(/[\s,()]+/)].filter(w => w.length > 2);
    return diagramList.filter(d =>
      d.keywords.some(dk => {
        const dkLower = dk.toLowerCase();
        return searchTerms.some(st => dkLower.includes(st) || st.includes(dkLower));
      })
    );
  };

  const handleGenerate = async () => {
    if (!selectedSpec || !productId) return;
    setGenerating(true);
    setGuideContent(null);

    try {
      // Find matched diagrams
      const matched = contentOptions.find(o => o.id === 'diagrams')?.enabled
        ? getMatchedDiagrams(selectedSpec)
        : [];
      setMatchedDiagrams(matched);

      const diagramContext = matched.length > 0
        ? matched.map(d => `- ${d.title} (available as diagram image)`).join('\n')
        : '';

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
          board: 'dynamic',
          subject_name: subjectName || 'A Level',
          options: enabledOptions.map(o => o.id),
          past_paper_context: '',
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
        if (response.status === 402) {
          toast.error('AI service is temporarily unavailable. Please try again later.');
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

  const handleDownload = async () => {
    if (!guideContent || !selectedSpec) return;

    const markdownToHtml = (md: string): string => {
      let processed = md.replace(/\[DIAGRAM:\s*(.+?)\]/g, (match, title) => {
        const diagram = matchedDiagrams.find(d =>
          d.title.toLowerCase().includes(title.toLowerCase().trim()) ||
          title.toLowerCase().trim().includes(d.title.toLowerCase())
        );
        if (diagram) {
          return `<div class="diagram-inline"><img src="${window.location.origin}${diagram.imagePath}" alt="${diagram.title}" /><p class="diagram-caption">${diagram.title}</p></div>`;
        }
        return '';
      });
      return marked(processed, { async: false }) as string;
    };

    const htmlContent = markdownToHtml(guideContent);

    // Load logo
    let logoDataUrl = '';
    try {
      const logoResponse = await fetch('/logos/a-star-logo-pdf.png');
      const logoBlob = await logoResponse.blob();
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    } catch (e) {
      console.error('Failed to load logo:', e);
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = '#ffffff';
    container.style.zIndex = '-1';
    container.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.7; padding: 10px; background: #ffffff;">
        <style>
          .pdf-content .logo { height: 48px; margin-bottom: 8px; }
          .pdf-content .main-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
          .pdf-content .spec-title { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #7C3AED; }
          .pdf-content .generated-by { font-size: 11px; color: #9ca3af; margin-bottom: 20px; }
          .pdf-content h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-top: 24px; margin-bottom: 8px; }
          .pdf-content h2 { font-size: 17px; font-weight: 700; color: #5b21b6; margin-top: 28px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E9D5FF; }
          .pdf-content h3 { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-top: 20px; margin-bottom: 8px; }
          .pdf-content h4 { font-size: 13px; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 6px; }
          .pdf-content p { margin-bottom: 10px; font-size: 13px; line-height: 1.7; }
          .pdf-content ul, .pdf-content ol { padding-left: 24px; margin-bottom: 12px; }
          .pdf-content li { margin-bottom: 5px; font-size: 13px; line-height: 1.6; }
          .pdf-content strong { color: #1e1b4b; }
          .pdf-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          .pdf-content pre { background: #f3f4f6; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
          .pdf-content .diagram-inline { margin: 14px 0; text-align: center; }
          .pdf-content .diagram-inline img { max-width: 80%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
          .pdf-content .diagram-caption { font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic; }
          .pdf-content .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 2px solid #E9D5FF; font-size: 11px; color: #9ca3af; }
          .pdf-content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .pdf-content th, .pdf-content td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 12px; }
          .pdf-content th { background: #f3e8ff; color: #5b21b6; font-weight: 600; }
        </style>
        <div class="pdf-content">
          ${logoDataUrl ? `<img src="${logoDataUrl}" alt="A* AI" class="logo" />` : ''}
          <div class="main-title">${subjectName}</div>
          <div class="spec-title">${selectedSpec.code}: ${selectedSpec.name}</div>
          <div class="generated-by">Revision Guide &middot; Generated by A* AI</div>
          ${htmlContent}
          <div class="footer">
            <p>Generated by A* AI &middot; astarai.co.uk</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `Revision-Guide-${selectedSpec.code}-${selectedSpec.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

      await html2pdf()
        .set({
          margin: [15, 20, 15, 20],
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(container.querySelector('.pdf-content'))
        .save();

      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleReset = () => {
    setGuideContent(null);
    setSelectedSpec(null);
    setSearchQuery('');
    setMatchedDiagrams([]);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Revision Guide</h3>
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
            setGuideContent(null);
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
              key={spec.id}
              onClick={() => { setSelectedSpec(spec); setSearchQuery(spec.name); setGuideContent(null); }}
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
              onClick={() => { setSelectedSpec(null); setSearchQuery(''); setGuideContent(null); }}
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

      {/* Generate or Download button */}
      {guideContent ? (
        <div className="space-y-2">
          <Button
            onClick={handleDownload}
            className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
            size="sm"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-muted-foreground text-xs">
            Generate New Guide
          </Button>
        </div>
      ) : (
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
      )}

      {!searchQuery && !guideContent && !selectedSpec && specLoaded && (
        <p className="text-xs text-center text-muted-foreground">
          Search for a topic to generate your personalised revision guide
        </p>
      )}

      {!specLoaded && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground ml-2">Loading spec points...</span>
        </div>
      )}
    </div>
  );
};