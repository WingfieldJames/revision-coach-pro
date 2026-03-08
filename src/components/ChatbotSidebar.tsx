import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Menu, ArrowLeft, Sparkles, TrendingUp, PenLine, FileSearch,
  BookOpen, BarChart2, RotateCcw, Timer, Crown, ChevronRight,
  GraduationCap, Home, Wrench,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkProductAccess } from '@/lib/productAccess';
import { supabase } from '@/lib/supabase';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';

import { MyAIPreferences } from '@/components/MyAIPreferences';
import { GradeBoundariesTool } from '@/components/GradeBoundariesTool';
import { PastPaperFinderTool } from '@/components/PastPaperFinderTool';
import { RevisionGuideTool } from '@/components/RevisionGuideTool';
import { EssayMarkerTool } from '@/components/EssayMarkerTool';
import { DiagramFinderTool } from '@/components/DiagramFinderTool';
import { MyMistakesTool } from '@/components/MyMistakesTool';
import { ExamCountdown, ExamDate } from '@/components/ExamCountdown';
import { fileDialogOpen } from '@/lib/fileDialogState';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

const SUBJECTS = [
  { name: 'Edexcel Economics', freePath: '/free-version', premiumPath: '/premium', slug: 'edexcel-economics' },
  { name: 'AQA Economics', freePath: '/aqa-free-version', premiumPath: '/aqa-premium', slug: 'aqa-economics' },
  { name: 'CIE Economics', freePath: '/cie-free-version', premiumPath: '/cie-premium', slug: 'cie-economics' },
  { name: 'OCR Computer Science', freePath: '/ocr-cs-free-version', premiumPath: '/ocr-cs-premium', slug: 'ocr-cs' },
  { name: 'OCR Physics', freePath: '/ocr-physics-free-version', premiumPath: '/ocr-physics-premium', slug: 'ocr-physics' },
  { name: 'AQA Chemistry', freePath: '/aqa-chemistry-free-version', premiumPath: '/aqa-chemistry-premium', slug: 'aqa-chemistry' },
  { name: 'AQA Psychology', freePath: '/aqa-psychology-free-version', premiumPath: '/aqa-psychology-premium', slug: 'aqa-psychology' },
  { name: 'Edexcel Maths (Pure)', freePath: '/edexcel-maths-free-version', premiumPath: '/edexcel-maths-premium', slug: 'edexcel-maths' },
  { name: 'Edexcel Maths (Applied)', freePath: '/edexcel-maths-applied-free-version', premiumPath: '/edexcel-maths-applied-premium', slug: 'edexcel-maths-applied' },
];

type ToolView = 'menu' | 'my-ai' | 'grade-boundaries' | 'past-papers' | 'revision-guide' | 'essay-marker' | 'diagrams' | 'my-mistakes' | 'exam-countdown';

export interface ChatbotSidebarProps {
  subjectName: string;
  productId?: string;
  productSlug?: string;
  showMyAI?: boolean;
  showGradeBoundaries?: boolean;
  showPastPaperFinder?: boolean;
  showRevisionGuide?: boolean;
  showEssayMarker?: boolean;
  showDiagramTool?: boolean;
  showMyMistakes?: boolean;
  showExamCountdown?: boolean;
  diagramSubject?: 'economics' | 'cs';
  customDiagramData?: Array<{ id: string; title: string; imagePath: string }>;
  pastPaperBoard?: 'edexcel' | 'aqa' | 'ocr-cs' | 'ocr-physics' | 'aqa-psychology' | 'edexcel-maths' | 'edexcel-maths-applied';
  revisionGuideBoard?: 'edexcel' | 'aqa' | 'ocr-cs' | 'ocr-physics' | 'aqa-psychology' | 'edexcel-maths' | 'edexcel-maths-applied';
  gradeBoundariesSubject?: 'economics' | 'maths';
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
  essayMarkerCustomMarks?: number[];
  onEssayMarkerSubmit?: (message: string, imageDataUrl?: string) => void;
  examDates?: ExamDate[];
  examSubjectName?: string;
  customPastPaperContent?: React.ReactNode;
  customRevisionGuideContent?: React.ReactNode;
}

export const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({
  subjectName,
  productId,
  productSlug,
  showMyAI = false,
  showGradeBoundaries = false,
  showPastPaperFinder = false,
  showRevisionGuide = false,
  showEssayMarker = false,
  showDiagramTool = false,
  showMyMistakes = false,
  showExamCountdown = false,
  diagramSubject = 'economics',
  customDiagramData,
  pastPaperBoard = 'edexcel',
  revisionGuideBoard = 'edexcel',
  gradeBoundariesSubject = 'economics',
  essayMarkerLabel = 'Essay Marker',
  essayMarkerFixedMark,
  essayMarkerCustomMarks,
  onEssayMarkerSubmit,
  examDates = [],
  examSubjectName = 'Exams',
  customPastPaperContent,
  customRevisionGuideContent,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ToolView>('menu');
  const [isDeluxe, setIsDeluxe] = useState(false);
  const [mistakesDueCount, setMistakesDueCount] = useState(0);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const isPremiumRoute = location.pathname.includes('premium');
  const tier = isDeluxe ? 'deluxe' : 'free';

  const daysUntilFirstExam = examDates.length > 0
    ? Math.ceil((Math.min(...examDates.map(e => e.date.getTime())) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
    : null;

  useEffect(() => {
    const checkDeluxe = async () => {
      if (!user || !productSlug) { setIsDeluxe(false); return; }
      try {
        const { hasAccess, tier } = await checkProductAccess(user.id, productSlug);
        setIsDeluxe(hasAccess && tier === 'deluxe');
      } catch { setIsDeluxe(false); }
    };
    checkDeluxe();
  }, [user, productSlug]);

  useEffect(() => {
    if (!open) setTimeout(() => setView('menu'), 300);
  }, [open]);

  const handleUpgradeClick = async (paymentType: 'monthly' | 'lifetime') => {
    if (!user) { window.location.href = '/login?redirect=stripe'; return; }
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) { window.location.href = '/login'; return; }
      const affiliateCode = getValidAffiliateCode();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType, productId, affiliateCode },
      });
      if (error) { alert(`Failed: ${(error as any).message || String(error)}`); return; }
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isCurrentSubject = (freePath: string, premPath: string) => {
    return location.pathname === freePath || location.pathname === premPath;
  };

  const navigateToSubject = async (freePath: string, premPath: string, slug: string) => {
    if (user) {
      try {
        const { hasAccess, tier: t } = await checkProductAccess(user.id, slug);
        navigate(hasAccess && t === 'deluxe' ? premPath : freePath);
      } catch {
        navigate(freePath);
      }
    } else {
      navigate(freePath);
    }
    setOpen(false);
  };

  const toolItems: Array<{ id: ToolView; label: string; icon: React.ReactNode; show: boolean; badge?: number }> = [
    { id: 'my-ai', label: 'My AI', icon: <Sparkles className="h-4 w-4" />, show: showMyAI },
    { id: 'grade-boundaries', label: 'Grade Boundaries', icon: <TrendingUp className="h-4 w-4" />, show: showGradeBoundaries },
    { id: 'past-papers', label: 'Past Papers', icon: <FileSearch className="h-4 w-4" />, show: showPastPaperFinder },
    { id: 'revision-guide', label: 'Revision Guide', icon: <BookOpen className="h-4 w-4" />, show: showRevisionGuide },
    { id: 'essay-marker', label: essayMarkerLabel, icon: <PenLine className="h-4 w-4" />, show: showEssayMarker },
    { id: 'diagrams', label: 'Diagram Generator', icon: <BarChart2 className="h-4 w-4" />, show: showDiagramTool },
    { id: 'my-mistakes', label: 'My Mistakes', icon: <RotateCcw className="h-4 w-4" />, show: showMyMistakes, badge: mistakesDueCount },
    { id: 'exam-countdown', label: 'Exam Timeline', icon: <Timer className="h-4 w-4" />, show: showExamCountdown && examDates.length > 0 },
  ];

  const visibleTools = toolItems.filter(t => t.show);

  const renderToolContent = () => {
    switch (view) {
      case 'my-ai': return <MyAIPreferences />;
      case 'grade-boundaries': return <GradeBoundariesTool subject={gradeBoundariesSubject} />;
      case 'past-papers': return customPastPaperContent || <PastPaperFinderTool tier={tier} productId={productId} board={pastPaperBoard} />;
      case 'revision-guide': return customRevisionGuideContent || <RevisionGuideTool board={revisionGuideBoard} tier={tier} productId={productId} />;
      case 'essay-marker': return (
        <EssayMarkerTool
          tier={tier}
          productId={productId}
          onSubmitToChat={(msg, img) => { onEssayMarkerSubmit?.(msg, img); setOpen(false); }}
          onClose={() => setView('menu')}
          fixedMark={essayMarkerFixedMark}
          toolLabel={essayMarkerLabel}
          customMarks={essayMarkerCustomMarks}
        />
      );
      case 'diagrams': return <DiagramFinderTool subject={diagramSubject} tier={tier} productId={productId} customDiagrams={customDiagramData} />;
      case 'my-mistakes': return <MyMistakesTool productId={productId} onDueCountChange={setMistakesDueCount} />;
      case 'exam-countdown': return <ExamCountdown exams={examDates} subjectName={examSubjectName} />;
      default: return null;
    }
  };

  const getToolTitle = () => {
    const tool = toolItems.find(t => t.id === view);
    return tool?.label || '';
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (fileDialogOpen.current && !o) return; setOpen(o); }} modal={false}>
        {/* Left-side vertically centered trigger button */}
         <SheetTrigger asChild>
          <button
            className="fixed left-3 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-2xl border border-border bg-background/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <Menu className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="text-[10px] font-semibold text-foreground leading-tight text-center">Menu<br/>&amp; Tools</span>
            {daysUntilFirstExam !== null && daysUntilFirstExam > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-destructive/10 text-destructive">
                <Timer className="h-2.5 w-2.5" />
                {daysUntilFirstExam}d
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent noOverlay side="left" className="top-[5.5rem] h-[calc(100vh-5.5rem)] w-[340px] sm:top-[5.5rem] sm:h-[calc(100vh-5.5rem)] sm:w-[380px] p-0 flex flex-col border-r border-border bg-background z-[55] [&>button:last-child]:hidden">
          {view === 'menu' ? (
            <>
              {/* Header with close button */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                    <h2 className="font-bold text-lg truncate">{subjectName}</h2>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Separator />

              <ScrollArea className="flex-1">
                <div className="px-3 py-3">
                  {/* TOOLS FIRST - prominent section */}
                  {visibleTools.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <Wrench className="h-3 w-3 text-primary" />
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          Your Tools
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        {visibleTools.map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => setView(tool.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm text-foreground hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all text-left group"
                          >
                            <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                              <span className="text-primary">{tool.icon}</span>
                            </span>
                            <span className="font-medium">{tool.label}</span>
                            {tool.badge && tool.badge > 0 ? (
                              <span className="ml-auto h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                                {tool.badge}
                              </span>
                            ) : (
                              <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-2" />

                  {/* Subject Navigator */}
                  <div className="mb-1">
                    <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Switch Subject
                    </p>
                    <div className="space-y-0.5">
                      {SUBJECTS.map(s => {
                        const active = isCurrentSubject(s.freePath, s.premiumPath);
                        return (
                          <button
                            key={s.freePath}
                            onClick={() => navigateToSubject(s.freePath, s.premiumPath, s.slug)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                              active
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            
                            <span className="truncate">{s.name}</span>
                            {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Navigation */}
                  <div className="mb-1">
                    <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Navigation
                    </p>
                    <button
                      onClick={() => { navigate('/'); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-all text-left group"
                    >
                      <Home className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => { navigate('/compare'); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-all text-left group"
                    >
                      <GraduationCap className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>All Subjects</span>
                    </button>
                  </div>
                </div>
              </ScrollArea>

              {/* Upgrade CTA / Deluxe Badge */}
              <div className="px-4 py-4 border-t border-border">
                {isDeluxe ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--gradient-brand)' }}>
                    <Crown className="h-4 w-4" />
                    <span>You're Deluxe! ✨</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { setOpen(false); setUpgradeDialogOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 glow-brand hover:glow-brand-intense"
                    style={{ background: 'var(--gradient-brand)' }}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Upgrade to Deluxe</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Tool Detail View */}
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setView('menu')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-base truncate">{getToolTitle()}</h3>
              </div>
              <Separator />
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {renderToolContent()}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Upgrade Dialog */}
      {!isDeluxe && (
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Upgrade to Premium</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-6 rounded-xl border-2 border-primary bg-muted relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  BEST VALUE
                </div>
                <h3 className="text-xl font-bold mb-1">💎 Monthly</h3>
                <p className="text-3xl font-bold mb-1">£8.99<span className="text-base font-normal">/mo</span></p>
                <p className="text-sm text-muted-foreground mb-4">Cancel anytime</p>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All past papers & mark schemes</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Full A* exam technique training</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Essay Marker + Diagram Generator</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Past Paper Finder</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Priority support</li>
                </ul>
                <Button variant="brand" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('monthly'); }}>
                  Get Monthly
                </Button>
              </div>
              <div className="p-6 rounded-xl border border-border bg-muted">
                <h3 className="text-xl font-bold mb-1">💎 Exam Season Pass</h3>
                <p className="text-3xl font-bold mb-1">£39.99</p>
                <p className="text-sm text-muted-foreground mb-4">One-time payment • Expires 30th June 2026</p>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All premium features included</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Flexible one-time payment</li>
                </ul>
                <Button variant="outline" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('lifetime'); }}>
                  Get Season Pass
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
