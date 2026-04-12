import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, FileText, Hash, ChevronRight, History, Loader2 } from "lucide-react";

interface MockPaper {
  id: string;
  exam_board: string;
  subject: string;
  paper_number: number;
  paper_name: string;
  year: number;
  total_marks: number;
  time_limit_minutes: number;
  questions: any[];
}

interface PastAttempt {
  id: string;
  total_score: number | null;
  max_score: number;
  percentage: number | null;
  status: string;
  started_at: string;
  paper_id: string;
}

interface MockExamToolProps {
  examBoard: string;
  subject: string;
  productId?: string;
  onClose?: () => void;
}

export const MockExamTool: React.FC<MockExamToolProps> = ({
  examBoard,
  subject,
  productId,
  onClose,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<MockPaper[]>([]);
  const [attempts, setAttempts] = useState<PastAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examBoard, subject, user]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch papers for this board + subject
    const { data: paperData, error: paperError } = await (supabase as any)
      .from("mock_papers")
      .select("*")
      .eq("active", true)
      .eq("exam_board", examBoard)
      .eq("subject", subject)
      .order("year", { ascending: false });

    // If table doesn't exist or is empty, auto-seed
    if (paperError || !paperData || paperData.length === 0) {
      if (!seeding) {
        setSeeding(true);
        try {
          await supabase.functions.invoke("seed-mock-papers");
          // Re-fetch after seeding
          const { data: retryData } = await (supabase as any)
            .from("mock_papers")
            .select("*")
            .eq("active", true)
            .eq("exam_board", examBoard)
            .eq("subject", subject)
            .order("year", { ascending: false });
          setPapers(retryData || []);
        } catch {
          setPapers([]);
        }
        setSeeding(false);
        setLoading(false);
        return;
      }
      setPapers([]);
    } else {
      setPapers(paperData);
    }

    // Fetch user's past attempts for these papers
    if (user && paperData && paperData.length > 0) {
      const paperIds = paperData.map((p: any) => p.id);
      const { data: attemptData } = await (supabase as any)
        .from("mock_results")
        .select("id, total_score, max_score, percentage, status, started_at, paper_id")
        .eq("user_id", user.id)
        .in("paper_id", paperIds)
        .order("started_at", { ascending: false })
        .limit(10);

      setAttempts(attemptData || []);
    }

    setLoading(false);
  };

  const handleStart = async (paper: MockPaper) => {
    if (!user) {
      toast.error("Please sign in to take a mock exam");
      return;
    }

    setStarting(paper.id);
    try {
      // Check for in-progress attempt
      const { data: existing } = await (supabase as any)
        .from("mock_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("paper_id", paper.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (existing) {
        onClose?.();
        navigate(`/mock-exam/${existing.id}`);
        return;
      }

      // Create new attempt
      const { data: result, error } = await (supabase as any)
        .from("mock_results")
        .insert({
          user_id: user.id,
          paper_id: paper.id,
          product_id: productId || null,
          max_score: paper.total_marks,
          answers: {},
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      onClose?.();
      navigate(`/mock-exam/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start exam");
    } finally {
      setStarting(null);
    }
  };

  const getScoreColor = (pct: number | null): string => {
    if (pct === null) return "text-muted-foreground";
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-amber-500";
    return "text-red-600";
  };

  const getAttemptsForPaper = (paperId: string) =>
    attempts.filter((a) => a.paper_id === paperId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // History view
  if (showHistory) {
    const completedAttempts = attempts.filter((a) => a.status === "completed");
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Past Attempts</h3>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowHistory(false)}>
            Back to Papers
          </Button>
        </div>
        {completedAttempts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No completed attempts yet.
          </p>
        ) : (
          <div className="space-y-2">
            {completedAttempts.map((a) => {
              const paper = papers.find((p) => p.id === a.paper_id);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    onClose?.();
                    navigate(`/mock-exam/${a.id}/results`);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{paper?.paper_name || "Paper"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.started_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getScoreColor(a.percentage)}`}>
                        {a.percentage?.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.total_score}/{a.max_score}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Main view — paper list
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          {examBoard} {subject} Mock Exams
        </h3>
        {attempts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowHistory(true)}
          >
            <History className="h-3 w-3" /> Past Attempts
          </Button>
        )}
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No mock papers available for {examBoard} {subject} yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {papers.map((paper) => {
            const paperAttempts = getAttemptsForPaper(paper.id);
            const bestAttempt = paperAttempts
              .filter((a) => a.status === "completed" && a.percentage !== null)
              .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];
            const inProgress = paperAttempts.find((a) => a.status === "in_progress");

            return (
              <div
                key={paper.id}
                className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {paper.year}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Paper {paper.paper_number}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{paper.paper_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Hash className="h-2.5 w-2.5" />
                        {paper.questions.length}q
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="h-2.5 w-2.5" />
                        {paper.total_marks}m
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {paper.time_limit_minutes}min
                      </span>
                      {bestAttempt && (
                        <span className={`font-medium ${getScoreColor(bestAttempt.percentage)}`}>
                          Best: {bestAttempt.percentage?.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {inProgress ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          onClose?.();
                          navigate(`/mock-exam/${inProgress.id}`);
                        }}
                      >
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => handleStart(paper)}
                        disabled={starting === paper.id}
                      >
                        {starting === paper.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Start"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
