interface SubjectFeatureGridProps {
  subject: string;
  subjectLabel: string;
  examBoard: string;
  formattedBoard: string;
  hasAccess: boolean;
  subscriptionPaymentType: string | null;
  onCtaClick: () => void;
}

interface Feature {
  icon: string;
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
      icon: '🤖',
      title: 'AI tutor',
      desc: `Trained on every past paper and mark scheme. Answers like an examiner thinks.`,
    },
  ];

  // Subject-specific features
  switch (subject) {
    case 'economics':
      return [
        ...base,
        { icon: '✍️', title: 'Essay marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate labelled Economics diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'computer-science':
      return [
        ...base,
        { icon: '✍️', title: 'Long answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate data structures, logic gates, and network diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'physics':
      return [
        ...base,
        { icon: '✍️', title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate labelled Physics diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'chemistry':
      return [
        ...base,
        { icon: '✍️', title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate labelled Chemistry diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'psychology':
      return [
        ...base,
        { icon: '✍️', title: 'Essay marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate labelled Psychology diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    case 'mathematics':
      return [
        ...base,
        { icon: '✍️', title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Graph plotter', desc: 'Auto-generate labelled graphs and diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
      ];
    default:
      return [
        ...base,
        { icon: '✍️', title: 'Answer marker', desc: `Instant feedback using exact ${formattedBoard} marking criteria. Upload a photo or type it in.` },
        { icon: '📄', title: 'Past paper finder', desc: 'Questions searchable by topic, year and difficulty.' },
        { icon: '📊', title: 'Diagram generator', desc: 'Auto-generate labelled diagrams from any prompt.' },
        { icon: '🧠', title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
        { icon: '📚', title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
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
}: SubjectFeatureGridProps) {
  const features = getFeatures(subject, formattedBoard);
  const emoji = getSubjectEmoji(subject);

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="bg-muted/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-border/50 shadow-elevated text-left">
        {/* Subject header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
              {emoji}
            </div>
            <div>
              <div className="text-xl sm:text-[22px] font-black tracking-tight text-foreground">
                {subjectLabel}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formattedBoard} A-Level · Full spec coverage
              </div>
            </div>
          </div>
          <button
            onClick={onCtaClick}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 glow-brand hover:glow-brand-intense bg-gradient-brand"
          >
            {hasAccess ? 'Go to chat →' : 'Start studying →'}
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-background border border-border/50 hover:border-primary/30 rounded-xl p-4 transition-colors"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm mb-3">
                {f.icon}
              </div>
              <div className="text-[13px] font-semibold text-foreground mb-1">
                {f.title}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
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
