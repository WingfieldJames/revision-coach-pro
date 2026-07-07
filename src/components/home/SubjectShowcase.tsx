import React from "react";
import { useNavigate } from "react-router-dom";
import { Bot, PenLine, FileText, BarChart3, Brain, BookOpen, ArrowRight, ChevronDown, Check, LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import logoMark from "@/assets/logo-mark.png";

type Subject = "economics" | "mathematics" | "computer-science" | "psychology" | "chemistry" | "physics";
type Board = "edexcel" | "aqa" | "cie" | "ocr";

const SUBJECTS: { id: Subject; label: string }[] = [
  { id: "economics", label: "Economics" },
  { id: "mathematics", label: "Mathematics" },
  { id: "computer-science", label: "Computer Science" },
  { id: "psychology", label: "Psychology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
];

const BOARDS: Record<Subject, Board[]> = {
  economics: ["edexcel", "aqa", "cie"],
  mathematics: ["edexcel", "aqa", "ocr"],
  "computer-science": ["ocr"],
  psychology: ["aqa"],
  chemistry: ["aqa"],
  physics: ["ocr"],
};

const boardLabel = (b: Board) => (b === "cie" ? "CIE" : b === "aqa" ? "AQA" : b === "ocr" ? "OCR" : "Edexcel");

const getFeatures = (subject: Subject, label: string, board: Board): { icon: LucideIcon; title: string; desc: string }[] => {
  const markerName =
    subject === "economics" || subject === "psychology" ? "Essay marker" : subject === "computer-science" ? "Long answer marker" : "Answer marker";
  const diagram =
    subject === "computer-science"
      ? { title: "Diagram generator", desc: "Auto-generate data structures, logic gates, and network diagrams from any prompt." }
      : subject === "mathematics"
      ? { title: "Graph plotter", desc: "Auto-generate labelled graphs and diagrams from any prompt." }
      : { title: "Diagram generator", desc: `Auto-generate labelled ${label} diagrams from any prompt.` };
  return [
    { icon: Bot, title: "AI tutor", desc: "Trained on every past paper and mark scheme. Answers like an examiner thinks." },
    { icon: PenLine, title: markerName, desc: `Instant feedback using exact ${boardLabel(board)} marking criteria. Upload a photo or type it in.` },
    { icon: FileText, title: "Past paper finder", desc: "2,000+ questions searchable by topic, year and difficulty." },
    { icon: BarChart3, title: diagram.title, desc: diagram.desc },
    { icon: Brain, title: "A* memory", desc: "Remembers your weak spots across every session and drills them until they stick." },
    { icon: BookOpen, title: "Revision guide", desc: "Spec-aligned notes for every topic. Written the way examiners want to see it." },
  ];
};

const freePath = (subject: Subject, board: Board) => {
  if (subject === "computer-science") return "/ocr-cs-free-version";
  if (subject === "physics") return "/ocr-physics-free-version";
  if (subject === "chemistry") return "/aqa-chemistry-free-version";
  if (subject === "psychology") return "/aqa-psychology-free-version";
  if (subject === "mathematics" && board === "ocr") return "/s/ocr-maths/free";
  if (subject === "mathematics" && board === "aqa") return "/s/aqa-mathematics/free";
  if (subject === "mathematics") return "/edexcel-maths-free-version";
  if (board === "aqa") return "/aqa-free-version";
  if (board === "cie") return "/cie-free-version";
  return "/free-version";
};

export const SubjectShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = React.useState<Subject>("economics");
  const [board, setBoard] = React.useState<Board>("edexcel");

  const label = SUBJECTS.find((s) => s.id === subject)!.label;
  const boards = BOARDS[subject];
  const features = getFeatures(subject, label, board);

  const pickSubject = (id: Subject) => {
    setSubject(id);
    setBoard(BOARDS[id][0]);
  };

  const startStudying = () => {
    const path = freePath(subject, board);
    if (!user) {
      window.location.href = `/login?redirect=${path.replace(/^\//, "")}`;
      return;
    }
    window.location.href = path;
  };

  return (
    <section data-section="pick-subject-bottom" className="py-24 px-8 relative">
      <div className="text-center mb-14">
        <h2 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold leading-[1.2] tracking-tight flex items-center justify-center gap-3.5 text-foreground">
          Time to get you an <img src={logoMark} alt="A*" className="h-[1em] w-auto object-contain" />
        </h2>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Level + subject pills */}
        <div className="flex justify-center items-center gap-3 mb-12 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground whitespace-nowrap transition-colors hover:bg-muted">
                A-Level
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
              <DropdownMenuItem className="cursor-pointer" onClick={() => localStorage.setItem("qualification_level", "alevel")}>
                A-Level
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  localStorage.setItem("qualification_level", "gcse");
                  navigate("/gcse");
                }}
              >
                GCSE
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex rounded-full border border-border bg-background p-1.5 gap-1 flex-wrap justify-center">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => pickSubject(s.id)}
                className={`px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  s.id === subject ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject header + start studying */}
        <div className="text-left mb-12">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="text-[22px] font-extrabold tracking-tight text-foreground">{label}</div>
              {boards.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full px-4 py-1.5 text-sm font-medium border border-border bg-background text-foreground inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:bg-muted">
                      {boardLabel(board)}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                    {boards.map((b) => (
                      <DropdownMenuItem key={b} className="cursor-pointer flex items-center gap-2" onClick={() => setBoard(b)}>
                        {board === b ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                        {boardLabel(b)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="rounded-full px-4 py-1.5 text-sm font-medium border border-border bg-background text-foreground inline-flex items-center gap-1.5 whitespace-nowrap">
                  {boardLabel(board)}
                </div>
              )}
            </div>
            <button onClick={startStudying} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-gradient-brand hover:opacity-75 transition-opacity">
              Start studying
              <ArrowRight className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-muted rounded-xl p-7">
                <f.icon className="w-6 h-6 text-primary mb-3.5" strokeWidth={2} />
                <div className="text-base font-bold text-foreground mb-2">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>

          <button onClick={startStudying} className="sm:hidden w-full mt-5 px-5 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-brand glow-brand">
            Start studying →
          </button>
          <p className="text-xs text-muted-foreground mt-4">Free to start · No credit card required</p>
        </div>
      </div>
    </section>
  );
};
