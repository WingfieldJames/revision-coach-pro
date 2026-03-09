import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, TrendingUp, PenLine, FileSearch, BookOpen,
  BarChart2, RotateCcw, Timer, Crown,
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
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
  essayMarkerCustomMarks?: number[];
  onEssayMarkerSubmit?: (message: string, imageDataUrl?: string) => void;
  examDates?: ExamDate[];
  examSubjectName?: string;
  customPastPaperContent?: React.ReactNode;
  customRevisionGuideContent?: React.ReactNode;
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
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  const [isDeluxe, setIsDeluxe] = useState(false);
  const [mistakesDueCount, setMistakesDueCount] = useState(0);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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
    { id: 'my-ai', label: 'My AI', icon: <Sparkles className="h-4 w-4" />, show: showMyAI },
    { id: 'grade-boundaries', label: 'Grade Boundaries', icon: <TrendingUp className="h-4 w-4" />, show: showGradeBoundaries },
    { id: 'diagrams', label: 'Diagram Generator', icon: <BarChart2 className="h-4 w-4" />, show: showDiagramTool },
    { id: 'essay-marker', label: essayMarkerLabel, icon: <PenLine className="h-4 w-4" />, show: showEssayMarker },
    { id: 'past-papers', label: 'Past Papers', icon: <FileSearch className="h-4 w-4" />, show: showPastPaperFinder },
    { id: 'revision-guide', label: 'Revision Guide', icon: <BookOpen className="h-4 w-4" />, show: showRevisionGuide },
    { id: 'my-mistakes', label: 'My Mistakes', icon: <RotateCcw className="h-4 w-4" />, show: showMyMistakes, badge: mistakesDueCount },
    { id: 'exam-countdown', label: 'Exam Countdown', icon: <Timer className="h-4 w-4" />, show: showExamCountdown && examDates.length > 0 },
  ];

  const visibleTools = toolItems.filter(t => t.show);

  const renderToolContent = (id: string) => {
    switch (id) {
      case 'my-ai': return <MyAIPreferences productId={productId} />;
      case 'grade-boundaries': return <GradeBoundariesTool subject={gradeBoundariesSubject} />;
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
                {tool.icon}
                <span className="hidden sm:inline">{tool.label}</span>
                {tool.id === 'my-mistakes' && mistakesDueCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                    {mistakesDueCount}
                  </span>
                )}
                {tool.id === 'exam-countdown' && daysUntilFirstExam !== null && daysUntilFirstExam > 0 && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">{daysUntilFirstExam} days</span>
                    <span className="sm:hidden text-muted-foreground">{daysUntilFirstExam}d</span>
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
                {renderToolContent(tool.id)}
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
            onClick={() => handleUpgradeClick('lifetime')}
            className="flex items-center gap-1.5 rounded-full text-white text-sm font-semibold px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        )}
      </div>
    </div>
  );
};
