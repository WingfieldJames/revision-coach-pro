import { ChevronDown, Check, Bot, PenLine, FileText, BarChart3, Brain, BookOpen, ArrowRight, LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SubjectFeatureGridProps {
  subject: string;
  subjectLabel: string;
  examBoard: string;
  formattedBoard: string;
  hasAccess: boolean;
  subscriptionPaymentType: string | null;
  onCtaClick: () => void;
  boards?: string[];
  onBoardChange?: (board: string) => void;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const getSubjectEmoji = (subject: string) => {
  switch (subject) {
    case 'economics': return '📈';
    case 'computer-science': return '💻';
    case 'physics': return '⚛️';
    case 'chemistry': return '🧪';
    case 'psychology': return '🧠';
    case 'mathematics': return '📐';
    default: return '📚';
  }
};

const getFeatures = (subject: string, formattedBoard: string): Feature[] => {
  const base: Feature[] = [
    {
      icon: Bot,
      title: 'AI tutor',
      desc: `Trained on every past paper and mark scheme. Answers like an examiner thinks.`,
    },
  ];

  // Subject-specific features
  switch (subject) {
    case 'economics':
      return [
        ...base,
        { icon: PenLine, title: 'Essay marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate labelled Economics diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'computer-science':
      return [
        ...base,
        { icon: PenLine, title: 'Long answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate data structures, logic gates, and network diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'physics':
      return [
        ...base,
        { icon: PenLine, title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate labelled Physics diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'chemistry':
      return [
        ...base,
        { icon: PenLine, title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate labelled Chemistry diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'psychology':
      return [
        ...base,
        { icon: PenLine, title: 'Essay marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate labelled Psychology diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'mathematics':
      return [
        ...base,
        { icon: PenLine, title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Graph plotter', desc: 'Auto-generate labelled graphs and diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    default:
      return [
        ...base,
        { icon: PenLine, title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: FileText, title: 'Past paper finder', desc: 'Questions searchable by topic, year and difficulty.' },
        { icon: BarChart3, title: 'Diagram generator', desc: 'Auto-generate labelled diagrams from any prompt.' },
        { icon: Brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: BookOpen, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
  }
};

export function SubjectFeatureGrid({
  subject,
  subjectLabel,
  examBoard,
  formattedBoard,
  hasAccess,
  subscriptionPaymentType,
  onCtaClick,
  boards,
  onBoardChange,
}: SubjectFeatureGridProps) {
  const features = getFeatures(subject, formattedBoard);

  const formatBoard = (b: string) => {
    if (b === 'cie') return 'CIE';
    if (b === 'aqa') return 'AQA';
    if (b === 'ocr') return 'OCR';
    if (b === 'edexcel') return 'Edexcel';
    return b.toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto mb-12">
      <div className="text-left">
        {/* Subject header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-xl sm:text-[22px] font-black tracking-tight text-foreground">
              {subjectLabel}
            </div>
            {boards && boards.length > 0 && onBoardChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-4 py-1.5 text-sm font-medium border border-border bg-background text-foreground transition-all flex items-center gap-1.5 whitespace-nowrap">
                    {formattedBoard || 'Select board'}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                  {boards.map(b => (
                    <DropdownMenuItem key={b} className="cursor-pointer flex items-center gap-2" onClick={() => onBoardChange(b)}>
                      {examBoard === b ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                      {formatBoard(b)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!boards && formattedBoard && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {formattedBoard} A-Level · Full spec coverage
              </div>
            )}
          </div>
          <button
            onClick={onCtaClick}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 glow-brand hover:glow-brand-intense bg-gradient-brand"
          >
            {hasAccess ? 'Go to chat →' : 'Start studying →'}
          </button>
          <button
            onClick={onCtaClick}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-brand text-white shadow-md active:scale-95 transition-transform"
            aria-label="Open chatbot"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-secondary border-0 rounded-xl p-7"
            >
              <f.icon className="w-6 h-6 text-primary mb-3.5" />
              <div className="text-base font-bold text-foreground mb-2">
                {f.title}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile CTA + status */}
        <div className="mt-5 sm:mt-4">
          <button
            onClick={onCtaClick}
            className="sm:hidden w-full px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 glow-brand bg-gradient-brand mb-3"
          >
            {hasAccess ? 'Go to chat →' : 'Start studying →'}
          </button>
          <p className="text-xs text-muted-foreground">
            {hasAccess
              ? (subscriptionPaymentType === 'lifetime' ? 'Exam season pass active' : 'Monthly pass active')
              : 'Free to start · No credit card required'}
          </p>
        </div>
      </div>
    </div>
  );
}
