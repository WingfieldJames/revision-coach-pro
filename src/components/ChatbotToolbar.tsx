import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, TrendingUp, PenLine, FileSearch, BookOpen,
  BarChart2, RotateCcw, Timer, Crown, ArrowLeftRight, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkProductAccess } from '@/lib/productAccess';
import { supabase } from '@/lib/supabase';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { useTheme } from '@/contexts/ThemeContext';
import { fileDialogOpen } from '@/lib/fileDialogState';

import { MyAIPreferences } from '@/components/MyAIPreferences';
import { GradeBoundariesTool } from '@/components/GradeBoundariesTool';
import { PastPaperFinderTool } from '@/components/PastPaperFinderTool';
import { RevisionGuideTool } from '@/components/RevisionGuideTool';
import { EssayMarkerTool } from '@/components/EssayMarkerTool';
import { DiagramFinderTool } from '@/components/DiagramFinderTool';
import { MyMistakesTool } from '@/components/MyMistakesTool';
import { ExamCountdown, ExamDate } from '@/components/ExamCountdown';
import { GraphSketcherTool } from '@/components/GraphSketcherTool';
import { StatisticalDistributionTool } from '@/components/StatisticalDistributionTool';
import { MockExamTool } from '@/components/MockExamTool';

import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

export interface ChatbotToolbarProps {
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
  gradeBoundariesData?: Record<string, Record<string, number>> | null;
  isGCSE?: boolean;
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
  essayMarkerCustomMarks?: number[];
  onEssayMarkerSubmit?: (message: string, imageDataUrl?: string | string[]) => void;
  examDates?: ExamDate[];
  examSubjectName?: string;
  customPastPaperContent?: React.ReactNode;
  customRevisionGuideContent?: React.ReactNode;
  showMockExam?: boolean;
  mockExamBoard?: string;
  mockExamSubject?: string;
  showGraphSketcher?: boolean;
  showStatDistribution?: boolean;
  /** Maths mode switcher */
  showMathsModeSwitcher?: boolean;
  mathsMode?: 'pure' | 'applied';
  onMathsModeChange?: (mode: 'pure' | 'applied') => void;
}

export const ChatbotToolbar: React.FC<ChatbotToolbarProps> = ({
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
  gradeBoundariesData,
  isGCSE = false,
  essayMarkerLabel = 'Essay Marker',
  essayMarkerFixedMark,
  essayMarkerCustomMarks,
  onEssayMarkerSubmit,
  examDates = [],
  examSubjectName = 'Exams',
  customPastPaperContent,
  customRevisionGuideContent,
  showMockExam = false,
  mockExamBoard = '',
  mockExamSubject = '',
  showGraphSketcher = false,
  showStatDistribution = false,
  showMathsModeSwitcher = false,
  mathsMode = 'pure',
  onMathsModeChange,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  const [isDeluxe, setIsDeluxe] = useState(false);
  const [mistakesDueCount, setMistakesDueCount] = useState(0);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
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

  const handlePopoverChange = (id: string, open: boolean) => {
    if (fileDialogOpen.current && !open) return;
    setOpenPopover(open ? id : null);
  };

  const toolItems = [
    { id: 'maths-mode', label: mathsMode === 'pure' ? 'Pure' : 'Applied (Statistics and Mechanics)', icon: <ArrowLeftRight className="h-4 w-4" />, show: showMathsModeSwitcher },
    { id: 'my-ai', label: 'My AI', icon: <Sparkles className="h-4 w-4" />, show: showMyAI },
    { id: 'grade-boundaries', label: 'Grade Boundaries', icon: <TrendingUp className="h-4 w-4" />, show: showGradeBoundaries },
    { id: 'graph-sketcher', label: 'Graph Sketcher', icon: <BarChart2 className="h-4 w-4" />, show: showGraphSketcher },
    { id: 'stat-distribution', label: 'Distributions', icon: <TrendingUp className="h-4 w-4" />, show: showStatDistribution },
    { id: 'diagrams', label: 'Diagram Generator', icon: <BarChart2 className="h-4 w-4" />, show: showDiagramTool },
    { id: 'essay-marker', label: essayMarkerLabel, icon: <PenLine className="h-4 w-4" />, show: showEssayMarker },
    { id: 'past-papers', label: 'Past Papers', icon: <FileSearch className="h-4 w-4" />, show: showPastPaperFinder },
    { id: 'revision-guide', label: 'Revision Guide', icon: <BookOpen className="h-4 w-4" />, show: showRevisionGuide },
    { id: 'mock-exams', label: 'Mock Exams', icon: <ClipboardList className="h-4 w-4" />, show: showMockExam },
    { id: 'my-mistakes', label: 'My Mistakes', icon: <RotateCcw className="h-4 w-4" />, show: showMyMistakes, badge: mistakesDueCount },
    { id: 'exam-countdown', label: 'Exam Countdown', icon: <Timer className="h-4 w-4" />, show: showExamCountdown && examDates.length > 0 },
  ];

  const visibleTools = toolItems.filter(t => t.show);

  const renderToolContent = (id: string) => {
    switch (id) {
      case 'maths-mode': return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">Switch Mode</p>
          {(['pure', 'applied'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { onMathsModeChange?.(mode); setOpenPopover(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                mathsMode === mode ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
              }`}
            >
              {mode === 'pure' ? '📐 Pure Mathematics' : '📊 Applied (Statistics and Mechanics)'}
            </button>
          ))}
        </div>
      );
      case 'my-ai': return <MyAIPreferences productId={productId} isDeluxe={isDeluxe} />;
      case 'grade-boundaries': return <GradeBoundariesTool gradeBoundariesData={gradeBoundariesData} isGCSE={isGCSE} />;
      case 'graph-sketcher': return <GraphSketcherTool />;
      case 'stat-distribution': return <StatisticalDistributionTool />;
      case 'past-papers': return customPastPaperContent || <PastPaperFinderTool tier={tier} productId={productId} board={pastPaperBoard} />;
      case 'revision-guide': return customRevisionGuideContent || <RevisionGuideTool board={revisionGuideBoard} tier={tier} productId={productId} />;
      case 'essay-marker': return (
        <EssayMarkerTool
          tier={tier}
          productId={productId}
          onSubmitToChat={(msg, img) => { onEssayMarkerSubmit?.(msg, img); setOpenPopover(null); }}
          onClose={() => setOpenPopover(null)}
          fixedMark={essayMarkerFixedMark}
          toolLabel={essayMarkerLabel}
          customMarks={essayMarkerCustomMarks}
        />
      );
      case 'diagrams': return <DiagramFinderTool subject={diagramSubject} tier={tier} productId={productId} customDiagrams={customDiagramData} />;
      case 'mock-exams': return <MockExamTool examBoard={mockExamBoard} subject={mockExamSubject} productId={productId} onClose={() => setOpenPopover(null)} />;
      case 'my-mistakes': return <MyMistakesTool productId={productId} onDueCountChange={setMistakesDueCount} />;
      case 'exam-countdown': return <ExamCountdown exams={examDates} subjectName={examSubjectName} />;
      default: return null;
    }
  };

  return (
    <div className="sticky top-0 z-50 flex justify-between items-center px-3 sm:px-6 pt-4 sm:pt-6 pb-2 text-foreground bg-background/95 backdrop-blur-sm">
      {/* Left: Logo + Tools */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={currentLogo} alt="A* AI logo" className="h-16 sm:h-20" />
        </Link>

        {visibleTools.map(tool => (
          tool.id === 'maths-mode' ? (
            <Button
              key={tool.id}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 transition-all duration-200 flex-shrink-0"
              onClick={() => onMathsModeChange?.(mathsMode === 'pure' ? 'applied' : 'pure')}
            >
              {tool.icon}
              <span className="hidden sm:inline">{tool.label}</span>
            </Button>
          ) : (
          <Popover
            key={tool.id}
            open={openPopover === tool.id}
            onOpenChange={(open) => handlePopoverChange(tool.id, open)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 transition-all duration-200 flex-shrink-0 relative"
              >
                {tool.id !== 'exam-countdown' && tool.icon}
                {tool.id !== 'exam-countdown' && <span className="hidden sm:inline">{tool.label}</span>}
                {tool.id === 'my-mistakes' && mistakesDueCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                    {mistakesDueCount}
                  </span>
                )}
                {tool.id === 'exam-countdown' && daysUntilFirstExam !== null && daysUntilFirstExam > 0 && (
                  <>
                    <span className="hidden sm:inline text-foreground font-medium">{daysUntilFirstExam} Days</span>
                    <span className="sm:hidden text-foreground font-medium">{daysUntilFirstExam}d</span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] max-w-md p-4 bg-background dark:bg-card border border-border shadow-xl"
              align="start"
              sideOffset={8}
              onInteractOutside={(e) => { if (fileDialogOpen.current) e.preventDefault(); }}
              onPointerDownOutside={(e) => { if (fileDialogOpen.current) e.preventDefault(); }}
              onFocusOutside={(e) => { if (fileDialogOpen.current) e.preventDefault(); }}
            >
              <ScrollArea className="max-h-[70vh]">
                {openPopover === tool.id && renderToolContent(tool.id)}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          )
        ))}
      </div>

      {/* Right: Upgrade / Deluxe badge */}
      <div className="flex-shrink-0 ml-2">
        {isDeluxe ? (
          <div
            className="flex items-center gap-1.5 rounded-full text-white text-sm font-semibold px-4 py-2"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Deluxe</span>
          </div>
        ) : (
          <button
            onClick={() => setUpgradeDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-full text-white text-sm font-semibold px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        )}
      </div>

      {/* Upgrade Dialog */}
      {!isDeluxe && (
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Upgrade to Premium</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-6 rounded-xl border-2 border-primary bg-muted relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">BEST VALUE</div>
                <h3 className="text-xl font-bold mb-1">💎 Monthly</h3>
                <p className="text-3xl font-bold mb-1">{isGCSE ? '£6.99' : '£8.99'}<span className="text-base font-normal">/mo</span></p>
                <p className="text-sm text-muted-foreground mb-4">Cancel anytime</p>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All past papers & mark schemes</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Full A* exam technique training</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Essay Marker + Diagram Generator</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Past Paper Finder</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Priority support</li>
                </ul>
                <Button variant="brand" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('monthly'); }}>Get Monthly</Button>
              </div>
              <div className="p-6 rounded-xl border border-border bg-muted">
                <h3 className="text-xl font-bold mb-1">💎 Exam Season Pass</h3>
                <p className="text-3xl font-bold mb-1"><span className="line-through text-red-500 text-lg mr-1">£39.99</span>{isGCSE ? '£17.99' : '£24.99'}</p>
                <p className="text-sm text-muted-foreground mb-4">One-time payment • Expires 30th June 2026</p>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All premium features included</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Flexible one-time payment</li>
                </ul>
                <Button variant="outline" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('lifetime'); }}>Get Season Pass</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
