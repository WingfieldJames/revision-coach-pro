import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Sparkles, Timer, Crown, ChevronRight, ChevronDown, ChevronUp,
  GraduationCap, Home, MessageSquare, Plus, Trash2, LogIn,
  CalendarDays, Clock3, X, Brain, User, BookOpen, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkProductAccess } from '@/lib/productAccess';
import { supabase } from '@/lib/supabase';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { useChatHistory, ChatConversation } from '@/hooks/useChatHistory';
import { useChatHistoryContext } from '@/contexts/ChatHistoryContext';
import { ExamDate } from '@/components/ExamCountdown';
import { cn } from '@/lib/utils';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

interface SubjectBoard {
  name: string;
  freePath: string;
  premiumPath: string;
  slug: string;
}

interface SubjectGroup {
  subject: string;
  boards: SubjectBoard[];
}

const SUBJECT_TREE: SubjectGroup[] = [
  {
    subject: 'Economics',
    boards: [
      { name: 'Edexcel', freePath: '/free-version', premiumPath: '/premium', slug: 'edexcel-economics' },
      { name: 'AQA', freePath: '/aqa-free-version', premiumPath: '/aqa-premium', slug: 'aqa-economics' },
      { name: 'CIE', freePath: '/cie-free-version', premiumPath: '/cie-premium', slug: 'cie-economics' },
    ],
  },
  {
    subject: 'Computer Science',
    boards: [
      { name: 'OCR', freePath: '/ocr-cs-free-version', premiumPath: '/ocr-cs-premium', slug: 'ocr-cs' },
    ],
  },
  {
    subject: 'Physics',
    boards: [
      { name: 'OCR', freePath: '/ocr-physics-free-version', premiumPath: '/ocr-physics-premium', slug: 'ocr-physics' },
    ],
  },
  {
    subject: 'Chemistry',
    boards: [
      { name: 'AQA', freePath: '/aqa-chemistry-free-version', premiumPath: '/aqa-chemistry-premium', slug: 'aqa-chemistry' },
    ],
  },
  {
    subject: 'Psychology',
    boards: [
      { name: 'AQA', freePath: '/aqa-psychology-free-version', premiumPath: '/aqa-psychology-premium', slug: 'aqa-psychology' },
    ],
  },
  {
    subject: 'Maths',
    boards: [
      { name: 'Edexcel (Pure)', freePath: '/edexcel-maths-free-version', premiumPath: '/edexcel-maths-premium', slug: 'edexcel-maths' },
      { name: 'Edexcel (Applied)', freePath: '/edexcel-maths-applied-free-version', premiumPath: '/edexcel-maths-applied-premium', slug: 'edexcel-maths-applied' },
      { name: 'AQA (Pure)', freePath: '/s/aqa-mathematics/free', premiumPath: '/s/aqa-mathematics/premium', slug: 'aqa-mathematics' },
      { name: 'AQA (Applied)', freePath: '/s/aqa-mathematics-applied/free', premiumPath: '/s/aqa-mathematics-applied/premium', slug: 'aqa-mathematics-applied' },
    ],
  },
];

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
  pastPaperBoard?: string;
  revisionGuideBoard?: string;
  gradeBoundariesSubject?: string;
  gradeBoundariesData?: Record<string, Record<string, number>> | null;
  isGCSE?: boolean;
  essayMarkerLabel?: string;
  essayMarkerFixedMark?: number;
  essayMarkerCustomMarks?: number[];
  onEssayMarkerSubmit?: (message: string, imageDataUrl?: string) => void;
  examDates?: ExamDate[];
  examSubjectName?: string;
  customPastPaperContent?: React.ReactNode;
  customRevisionGuideContent?: React.ReactNode;
}

const groupConversations = (convos: ChatConversation[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const groups: { label: string; items: ChatConversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Last 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];
  convos.forEach(c => {
    const d = new Date(c.updated_at);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  });
  return groups.filter(g => g.items.length > 0);
};

const formatRelativeTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
};

export const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({
  subjectName,
  productId,
  productSlug,
  examDates = [],
  showMyAI = false,
  showGradeBoundaries = false,
  gradeBoundariesData,
  isGCSE: isGCSEProp,
}) => {
  const isGCSE = isGCSEProp ?? (productSlug?.startsWith('gcse-') ?? false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isDeluxe, setIsDeluxe] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [showExamCalendar, setShowExamCalendar] = useState(false);
  const [showRevisionTimetable, setShowRevisionTimetable] = useState(false);
  const [showBrainViewer, setShowBrainViewer] = useState(false);
  const [showTrainerInfo, setShowTrainerInfo] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [showMyAIPopup, setShowMyAIPopup] = useState(false);
  const [showGradeBoundariesPopup, setShowGradeBoundariesPopup] = useState(false);

  // Lazy load heavy components
  const ExamCalendarFeature = React.lazy(() => import('@/components/ExamCalendarFeature').then(m => ({ default: m.ExamCalendarFeature })));
  const RevisionTimetable = React.lazy(() => import('@/components/RevisionTimetable').then(m => ({ default: m.RevisionTimetable })));
  const AStarBrainViewer = React.lazy(() => import('@/components/AStarBrainViewer').then(m => ({ default: m.AStarBrainViewer })));
  const TrainerInfoViewer = React.lazy(() => import('@/components/TrainerInfoViewer').then(m => ({ default: m.TrainerInfoViewer })));
  const MyAIPreferences = React.lazy(() => import('@/components/MyAIPreferences').then(m => ({ default: m.MyAIPreferences })));
  const GradeBoundariesTool = React.lazy(() => import('@/components/GradeBoundariesTool').then(m => ({ default: m.GradeBoundariesTool })));

  const chatHistoryCtx = useChatHistoryContext();
  const { conversations, loading, deleteConversation, fetchConversations } = useChatHistory(productId);

  const daysUntilFirstExam = examDates.length > 0
    ? Math.ceil((Math.min(...examDates.map(e => e.date.getTime())) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
    : null;

  useEffect(() => {
    if (chatHistoryCtx?.refreshKey) fetchConversations();
  }, [chatHistoryCtx?.refreshKey, fetchConversations]);

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

  const isCurrentSubject = (freePath: string, premPath: string) =>
    location.pathname === freePath || location.pathname === premPath;

  const navigateToSubject = async (freePath: string, premPath: string, slug: string) => {
    if (user) {
      try {
        const { hasAccess, tier: t } = await checkProductAccess(user.id, slug);
        navigate(hasAccess && t === 'deluxe' ? premPath : freePath);
      } catch { navigate(freePath); }
    } else { navigate(freePath); }
  };

  const handleNewChat = () => chatHistoryCtx?.onNewChat();
  const handleLoadConversation = (id: string) => chatHistoryCtx?.onLoadConversation(id);
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (chatHistoryCtx?.currentConversationId === id) chatHistoryCtx?.onNewChat();
  };

  const grouped = groupConversations(conversations);

  return (
    <>
      {/* Sidebar panel */}
      <div
        className={cn(
          "hidden md:flex fixed left-0 top-[5.5rem] h-[calc(100vh-5.5rem)] z-[35] flex-col bg-background transition-all duration-300 ease-in-out pt-2",
          "after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-border after:to-transparent",
          open ? "w-[300px] sm:w-[340px]" : "w-12"
        )}
      >
        {/* Header — always visible */}
        <div className={cn("flex items-center shrink-0 border-b border-border", open ? "px-4 py-3" : "px-0 py-3 justify-center")}>
          {open ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-bold text-sm truncate">{subjectName}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              title={subjectName}
            >
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          )}
        </div>

        {/* Collapsed state: icon strip */}
        {!open && (
          <div className="flex flex-col items-center gap-3 py-4">
            {/* Chat first */}
            <button onClick={() => setOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="Chat History">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={handleNewChat} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors" title="New Chat">
              <Plus className="h-4 w-4 text-primary" />
            </button>
            <Separator className="w-6" />
            {/* Tools */}
            <button onClick={() => setShowRevisionTimetable(true)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="Revision Timetable">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowExamCalendar(true)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="Exam Calendar">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => { setOpen(true); setShowBrainViewer(true); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="A* Brain">
              <Brain className="h-4 w-4 text-muted-foreground" />
            </button>
            <Separator className="w-6" />
            <button onClick={() => setOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title={subjectName}>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowTrainerInfo(true)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" title="Meet Your Trainer">
              <User className="h-4 w-4 text-muted-foreground" />
            </button>
            {daysUntilFirstExam !== null && daysUntilFirstExam > 0 && (
              <>
                <Separator className="w-6" />
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-destructive/10 text-destructive">
                  <Timer className="h-2.5 w-2.5" />
                  {daysUntilFirstExam}d
                </span>
              </>
            )}
          </div>
        )}

        {/* Expanded content */}
        {open && (
          <>
            <ScrollArea className="flex-1">
              <div className="px-3 py-3">
                {/* Chat History - FIRST */}

                {/* Chat History */}
                <div className="mb-3">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Chat History</p>
                    </div>
                    <button
                      onClick={handleNewChat}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      New Chat
                    </button>
                  </div>

                  {!user ? (
                    <div className="px-3 py-6 text-center">
                      <LogIn className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">Log in to save your chat history</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                    </div>
                  ) : loading ? (
                    <div className="px-3 py-6 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Loading chats...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Start chatting to see your history here</p>
                    </div>
                  ) : (() => {
                    const MAX_VISIBLE = 5;
                    const totalCount = grouped.reduce((sum, g) => sum + g.items.length, 0);
                    let remaining = showAllChats ? Infinity : MAX_VISIBLE;
                    return (
                      <div className="space-y-2">
                        {grouped.map(group => {
                          if (remaining <= 0) return null;
                          const visibleItems = group.items.slice(0, remaining);
                          remaining -= visibleItems.length;
                          return (
                            <div key={group.label}>
                              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
                              <div className="space-y-0.5">
                                {visibleItems.map(convo => {
                                  const isActive = chatHistoryCtx?.currentConversationId === convo.id;
                                  return (
                                    <button
                                      key={convo.id}
                                      onClick={() => handleLoadConversation(convo.id)}
                                      className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left group",
                                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                                      )}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="flex-1 truncate text-xs">{convo.title}</span>
                                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{formatRelativeTime(convo.updated_at)}</span>
                                      <button
                                        onClick={(e) => handleDeleteConversation(e, convo.id)}
                                        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {!showAllChats && totalCount > MAX_VISIBLE && (
                          <button
                            onClick={() => setShowAllChats(true)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <ChevronDown className="h-3 w-3" />
                            View {totalCount - MAX_VISIBLE} more
                          </button>
                        )}
                        {showAllChats && totalCount > MAX_VISIBLE && (
                          <button
                            onClick={() => setShowAllChats(false)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <ChevronUp className="h-3 w-3" />
                            Show less
                          </button>
                        )}
                      </div>
                    );
                  })()}

                </div>

                <Separator className="my-2" />

                {/* Additional Features */}
                <div className="mb-3">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setShowRevisionTimetable(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left text-foreground hover:bg-muted"
                    >
                      <Clock3 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-sm">Revision Timetable</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">Optimally allocates revision time based on your predicted grades</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowExamCalendar(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left text-foreground hover:bg-muted"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-sm">Exam Calendar</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">View all your upcoming exam dates in one place</span>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowBrainViewer(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left text-foreground hover:bg-muted"
                    >
                      <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-sm">Your A* Brain</span>
                        <span className="block text-[10px] text-muted-foreground leading-tight">Builds your personal profile from every conversation</span>
                      </div>
                    </button>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Subject Tree */}
                <div className="mb-1">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subjects</p>
                  <button
                    onClick={() => setSubjectsOpen(!subjectsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{subjectName}</span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", subjectsOpen && "rotate-180")} />
                  </button>
                  {subjectsOpen && (
                    <div className="ml-3 mt-1 space-y-0.5 border-l border-border pl-2">
                      {SUBJECT_TREE.map(group => {
                        const isExpanded = expandedSubject === group.subject;
                        const hasActiveBoard = group.boards.some(b => isCurrentSubject(b.freePath, b.premiumPath));
                        return (
                          <div key={group.subject}>
                            <button
                              onClick={() => setExpandedSubject(isExpanded ? null : group.subject)}
                              className={cn(
                                "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-all",
                                hasActiveBoard && "text-primary font-medium"
                              )}
                            >
                              <span>{group.subject}</span>
                              <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                            </button>
                            {isExpanded && (
                              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                                {group.boards.map(board => {
                                  const active = isCurrentSubject(board.freePath, board.premiumPath);
                                  return (
                                    <button
                                      key={board.slug}
                                      onClick={() => navigateToSubject(board.freePath, board.premiumPath, board.slug)}
                                      className={cn(
                                        "w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-all flex items-center gap-2",
                                        active && "font-semibold text-primary bg-primary/5"
                                      )}
                                    >
                                      <span>{board.name}</span>
                                      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Meet Your Trainer */}
                  <button
                    onClick={() => setShowTrainerInfo(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left text-foreground hover:bg-muted mt-1"
                  >
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-sm">Meet Your Trainer</span>
                      <span className="block text-[10px] text-muted-foreground leading-tight">See who trained your AI tutor</span>
                    </div>
                  </button>
                </div>

                <Separator className="my-2" />

                {/* Navigation */}
                <div className="space-y-0.5 mb-1">
                  <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-all text-left"
                  >
                    <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Home</span>
                  </button>
                </div>
              </div>
            </ScrollArea>

            {/* Upgrade CTA / Deluxe Badge */}
            <div className="px-4 py-3 border-t border-border">
              {isDeluxe ? (
                <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--gradient-brand)' }}>
                  <Crown className="h-4 w-4" />
                  <span>You're Deluxe! ✨</span>
                </div>
              ) : (
                <button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 glow-brand hover:glow-brand-intense"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Upgrade to Deluxe</span>
                </button>
              )}
            </div>
          </>
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

      {/* A* Brain Viewer Popup */}
      {showBrainViewer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowBrainViewer(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Your A* Brain
              </h2>
              <button onClick={() => setShowBrainViewer(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <AStarBrainViewer isDeluxe={isDeluxe} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Trainer Info Popup */}
      {showTrainerInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowTrainerInfo(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Meet the brain behind {subjectName}
              </h2>
              <button onClick={() => setShowTrainerInfo(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <TrainerInfoViewer productId={productId} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Exam Calendar Popup */}
      {showExamCalendar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowExamCalendar(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Exam Calendar
              </h2>
              <button onClick={() => setShowExamCalendar(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <ExamCalendarFeature compact />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Revision Timetable Popup */}
      {showRevisionTimetable && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowRevisionTimetable(false)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-primary" />
                Revision Timetable
              </h2>
              <button onClick={() => setShowRevisionTimetable(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <RevisionTimetable />
            </React.Suspense>
          </div>
        </div>
      )}
    </>
  );
};
