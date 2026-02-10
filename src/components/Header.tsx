import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, ITab } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { DiagramFinderTool } from '@/components/DiagramFinderTool';
import { EssayMarkerTool } from '@/components/EssayMarkerTool';
import { PastPaperFinderTool } from '@/components/PastPaperFinderTool';
import { RevisionGuideTool } from '@/components/RevisionGuideTool';
import { MyAIPreferences } from '@/components/MyAIPreferences';
import { ExamCountdown, ExamDate } from '@/components/ExamCountdown';
import { Sparkles, BarChart2, PenLine, Timer, FileSearch, Crown, BookOpen } from 'lucide-react';
import { checkProductAccess } from '@/lib/productAccess';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

// Global flag to track when file dialog is open (set by ImageUploadTool)
export const fileDialogOpen = { current: false };

interface HeaderProps {
  showNavLinks?: boolean;
  showImageTool?: boolean;
  showDiagramTool?: boolean;
  showEssayMarker?: boolean;
  showPastPaperFinder?: boolean;
  showRevisionGuide?: boolean;
  showExamCountdown?: boolean;
  examDates?: ExamDate[];
  examSubjectName?: string;
  toolsLocked?: boolean;
  hideUserDetails?: boolean;
  diagramSubject?: 'economics' | 'cs';
  pastPaperBoard?: 'edexcel' | 'aqa' | 'ocr-cs';
  revisionGuideBoard?: 'edexcel' | 'aqa' | 'ocr-cs';
  productId?: string;
  productSlug?: string;
  onEssayMarkerSubmit?: (message: string) => void;
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
  showUpgradeButton?: boolean;
  transparentBg?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false,
  showImageTool = false,
  showDiagramTool = false,
  showEssayMarker = false,
  showPastPaperFinder = false,
  showRevisionGuide = false,
  showExamCountdown = false,
  examDates = [],
  examSubjectName = "Exams",
  toolsLocked = false,
  hideUserDetails = false,
  diagramSubject = 'economics',
  pastPaperBoard = 'edexcel',
  revisionGuideBoard = 'edexcel',
  productId,
  productSlug,
  onEssayMarkerSubmit,
  essayMarkerLabel = "Essay Marker",
  essayMarkerFixedMark,
  showUpgradeButton = false,
  transparentBg = false
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const [imageToolOpen, setImageToolOpen] = useState(false);
  const [diagramToolOpen, setDiagramToolOpen] = useState(false);
  const [essayMarkerOpen, setEssayMarkerOpen] = useState(false);
  const [examCountdownOpen, setExamCountdownOpen] = useState(false);
  const [pastPaperFinderOpen, setPastPaperFinderOpen] = useState(false);
  const [revisionGuideOpen, setRevisionGuideOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isDeluxe, setIsDeluxe] = useState(false);

  const daysUntilFirstExam = examDates.length > 0 
    ? Math.ceil((Math.min(...examDates.map(e => e.date.getTime())) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    : 0;

  const tier = isDeluxe ? 'deluxe' : 'free';

  // Check if user has deluxe access for the current product
  useEffect(() => {
    const checkDeluxeAccess = async () => {
      if (!user || !productSlug) {
        setIsDeluxe(false);
        return;
      }
      try {
        const { hasAccess, tier } = await checkProductAccess(user.id, productSlug);
        setIsDeluxe(hasAccess && tier === 'deluxe');
      } catch {
        setIsDeluxe(false);
      }
    };
    checkDeluxeAccess();
  }, [user, productSlug]);

  useEffect(() => {
    const closeAllPopovers = () => {
      if (fileDialogOpen.current) return;
      setImageToolOpen(false);
      setDiagramToolOpen(false);
      setEssayMarkerOpen(false);
      setExamCountdownOpen(false);
      setPastPaperFinderOpen(false);
      setRevisionGuideOpen(false);
    };
    window.addEventListener('blur', closeAllPopovers);
    return () => window.removeEventListener('blur', closeAllPopovers);
  }, []);

  const getSelectedTab = () => {
    if (location.pathname === '/dashboard') return 'profile';
    if (location.pathname === '/login') return 'profile';
    if (location.pathname === '/compare') return 'pricing';
    return 'home';
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getSelectedTab());

  React.useEffect(() => {
    const newTab = getSelectedTab();
    if (newTab !== selectedTab) setSelectedTab(newTab);
  }, [location.pathname]);

  const tabs: ITab[] = [
    { title: "Home", value: "home" },
    { title: "Subjects", value: "pricing" },
    { title: "Launch", value: "profile" }
  ];

  const handleTabChange = (value: string) => {
    if (value === "home") {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else if (value === "pricing") {
      navigate('/compare');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else if (value === "profile") {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpgradeClick = async (paymentType: 'monthly' | 'lifetime') => {
    if (!user) {
      window.location.href = '/login?redirect=stripe';
      return;
    }
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        window.location.href = '/login';
        return;
      }
      const affiliateCode = getValidAffiliateCode();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType, productId, affiliateCode }
      });
      if (error) {
        alert(`Failed to create checkout: ${(error as any).message || String(error)}`);
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <header className={`sticky top-0 z-50 flex justify-between items-center px-3 sm:px-6 pt-4 sm:pt-6 pb-2 text-foreground ${transparentBg ? 'bg-transparent' : 'bg-background/95 backdrop-blur-sm'}`}>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
          <img src={currentLogo} alt="A* AI logo" className="h-16 sm:h-20" />
        </Link>
        
        {showImageTool && (
          <Popover open={imageToolOpen} onOpenChange={setImageToolOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">My AI</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-md p-4 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <MyAIPreferences />
            </PopoverContent>
          </Popover>
        )}
        
        {showDiagramTool && (
          <Popover open={diagramToolOpen} onOpenChange={setDiagramToolOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Diagram Generator</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-md p-0 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <div className="p-4">
                <DiagramFinderTool subject={diagramSubject} tier={tier} productId={productId} />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showEssayMarker && (
          <Popover open={essayMarkerOpen} onOpenChange={setEssayMarkerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">{essayMarkerLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-md p-0 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <div className="p-4">
                <EssayMarkerTool tier={tier} productId={productId} onSubmitToChat={onEssayMarkerSubmit} onClose={() => setEssayMarkerOpen(false)} fixedMark={essayMarkerFixedMark} toolLabel={essayMarkerLabel} />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showPastPaperFinder && (
          <Popover open={pastPaperFinderOpen} onOpenChange={setPastPaperFinderOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <FileSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Past Papers</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-lg p-4 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <PastPaperFinderTool tier={tier} productId={productId} board={pastPaperBoard} />
            </PopoverContent>
          </Popover>
        )}

        {showRevisionGuide && (
          <Popover open={revisionGuideOpen} onOpenChange={setRevisionGuideOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Revision Guide</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-lg p-4 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <RevisionGuideTool board={revisionGuideBoard} tier={tier} productId={productId} />
            </PopoverContent>
          </Popover>
        )}

        {showExamCountdown && examDates.length > 0 && (
          <Popover open={examCountdownOpen} onOpenChange={setExamCountdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">{daysUntilFirstExam} days</span>
                <span className="sm:hidden">{daysUntilFirstExam}d</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-sm p-4 bg-card border border-border shadow-xl" align="start" sideOffset={8}>
              <ExamCountdown exams={examDates} subjectName={examSubjectName} />
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {showNavLinks && (
        <div className="absolute left-1/2 -translate-x-1/2 md:left-1/2 ml-4 md:ml-0">
          <Tabs selected={selectedTab} setSelected={handleTabChange} tabs={tabs} variant="primary" />
        </div>
      )}

      {/* Right side: Upgrade Now / Deluxe badge on chatbot pages */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showUpgradeButton && (
          isDeluxe ? (
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <Crown className="h-4 w-4" />
              <span>Deluxe</span>
            </div>
          ) : (
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 glow-brand hover:glow-brand-intense"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Upgrade Now</span>
                  <span className="sm:hidden">Upgrade</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">Upgrade to Premium</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="p-6 rounded-xl border-2 border-primary bg-muted relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                      BEST VALUE
                    </div>
                    <h3 className="text-xl font-bold mb-1">💎 Exam Season Pass</h3>
                    <p className="text-3xl font-bold mb-1">£24.99</p>
                    <p className="text-sm text-muted-foreground mb-4">One-time payment • Expires 30th June 2026</p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All past papers & mark schemes</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Full A* exam technique training</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Essay Marker + Diagram Generator</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Past Paper Finder</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Priority support</li>
                    </ul>
                    <Button variant="brand" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('lifetime'); }}>
                      Get Season Pass
                    </Button>
                  </div>

                  <div className="p-6 rounded-xl border border-border bg-muted">
                    <h3 className="text-xl font-bold mb-1">💎 Monthly</h3>
                    <p className="text-3xl font-bold mb-1">£6.99<span className="text-base font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground mb-4">Cancel anytime</p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> All premium features included</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 shrink-0" /> Flexible monthly billing</li>
                    </ul>
                    <Button variant="outline" size="lg" className="w-full" onClick={() => { setUpgradeDialogOpen(false); handleUpgradeClick('monthly'); }}>
                      Get Monthly
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        )}

        {user && !hideUserDetails && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[80px] sm:max-w-[120px] md:max-w-none hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-3">
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
