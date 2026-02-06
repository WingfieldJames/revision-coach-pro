import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, ITab } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { DiagramFinderTool } from '@/components/DiagramFinderTool';
import { EssayMarkerTool } from '@/components/EssayMarkerTool';
import { PastPaperFinderTool } from '@/components/PastPaperFinderTool';
import { MyAIPreferences } from '@/components/MyAIPreferences';
import { ExamCountdown, ExamDate } from '@/components/ExamCountdown';
import { Sparkles, BarChart2, PenLine, Timer, FileSearch } from 'lucide-react';

// Global flag to track when file dialog is open (set by ImageUploadTool)
export const fileDialogOpen = { current: false };

interface HeaderProps {
  showNavLinks?: boolean;
  showImageTool?: boolean;
  showDiagramTool?: boolean;
  showEssayMarker?: boolean;
  showPastPaperFinder?: boolean;
  showExamCountdown?: boolean;
  examDates?: ExamDate[];
  examSubjectName?: string;
  toolsLocked?: boolean;
  hideUserDetails?: boolean;
  diagramSubject?: 'economics' | 'cs';
  productId?: string;
  onEssayMarkerSubmit?: (message: string) => void;
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  showNavLinks = false,
  showImageTool = false,
  showDiagramTool = false,
  showEssayMarker = false,
  showPastPaperFinder = false,
  showExamCountdown = false,
  examDates = [],
  examSubjectName = "Exams",
  toolsLocked = false,
  hideUserDetails = false,
  diagramSubject = 'economics',
  productId,
  onEssayMarkerSubmit,
  essayMarkerLabel = "Essay Marker",
  essayMarkerFixedMark
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [imageToolOpen, setImageToolOpen] = useState(false);
  const [diagramToolOpen, setDiagramToolOpen] = useState(false);
  const [essayMarkerOpen, setEssayMarkerOpen] = useState(false);
  const [examCountdownOpen, setExamCountdownOpen] = useState(false);
  const [pastPaperFinderOpen, setPastPaperFinderOpen] = useState(false);

  // Calculate days until first exam for the button
  const daysUntilFirstExam = examDates.length > 0 
    ? Math.ceil((Math.min(...examDates.map(e => e.date.getTime())) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine tier based on toolsLocked prop
  const tier = toolsLocked ? 'free' : 'deluxe';

  // Close all popovers when clicking on iframe (detected via window blur)
  // Skip if file dialog is open to prevent closing when picking a file
  useEffect(() => {
    const closeAllPopovers = () => {
      // Don't close if file dialog is open
      if (fileDialogOpen.current) {
        return;
      }
      setImageToolOpen(false);
      setDiagramToolOpen(false);
      setEssayMarkerOpen(false);
      setExamCountdownOpen(false);
      setPastPaperFinderOpen(false);
    };

    window.addEventListener('blur', closeAllPopovers);
    return () => window.removeEventListener('blur', closeAllPopovers);
  }, []);

  // Determine selected tab based on current route
  const getSelectedTab = () => {
    if (location.pathname === '/dashboard') return 'profile';
    if (location.pathname === '/login') return 'profile';
    if (location.pathname === '/compare') return 'pricing';
    return 'home';
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getSelectedTab());

  // Update selected tab when location changes
  React.useEffect(() => {
    const newTab = getSelectedTab();
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
    }
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
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        navigate('/login');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
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

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-3 sm:px-6 pt-4 sm:pt-6 pb-2 bg-background text-foreground">
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Link to="/" className="flex items-center" onClick={() => window.scrollTo(0, 0)}>
          <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-8 sm:h-10" />
        </Link>
        
        {showImageTool && (
          <Popover open={imageToolOpen} onOpenChange={setImageToolOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">My AI</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-4 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <MyAIPreferences />
            </PopoverContent>
          </Popover>
        )}
        
        {showDiagramTool && (
          <Popover open={diagramToolOpen} onOpenChange={setDiagramToolOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Diagram Generator</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-0 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <div className="p-4">
                <DiagramFinderTool subject={diagramSubject} tier={tier} productId={productId} />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showEssayMarker && (
          <Popover open={essayMarkerOpen} onOpenChange={setEssayMarkerOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">{essayMarkerLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-md p-0 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <div className="p-4">
                <EssayMarkerTool 
                  tier={tier} 
                  productId={productId} 
                  onSubmitToChat={onEssayMarkerSubmit}
                  onClose={() => setEssayMarkerOpen(false)}
                  fixedMark={essayMarkerFixedMark}
                  toolLabel={essayMarkerLabel}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showPastPaperFinder && (
          <Popover open={pastPaperFinderOpen} onOpenChange={setPastPaperFinderOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <FileSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Past Papers</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-lg p-4 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <PastPaperFinderTool tier={tier} productId={productId} />
            </PopoverContent>
          </Popover>
        )}

        {showExamCountdown && examDates.length > 0 && (
          <Popover open={examCountdownOpen} onOpenChange={setExamCountdownOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">{daysUntilFirstExam} days</span>
                <span className="sm:hidden">{daysUntilFirstExam}d</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[90vw] max-w-sm p-4 bg-background border border-border shadow-xl" 
              align="start"
              sideOffset={8}
            >
              <ExamCountdown exams={examDates} subjectName={examSubjectName} />
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {showNavLinks && (
        <div className={`flex-1 flex justify-center min-w-0 ${hideUserDetails ? 'justify-end pr-4' : 'px-2'}`}>
          <Tabs 
            selected={selectedTab} 
            setSelected={handleTabChange} 
            tabs={tabs} 
            variant="primary"
          />
        </div>
      )}

      {user && !hideUserDetails && (
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[80px] sm:max-w-[120px] md:max-w-none hidden sm:block">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-3">
            Sign Out
          </Button>
        </div>
      )}
    </header>
  );
};
