import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface QuestionResult {
  question_number: string;
  marks_awarded: number;
  marks_available: number;
  feedback: string;
  level: string;
}

interface ExamResultData {
  id: string;
  total_score: number | null;
  max_score: number;
  percentage: number | null;
  question_results: QuestionResult[];
  answers: Record<string, string>;
  status: string;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  tab_switches: number;
  mock_papers: {
    id: string;
    paper_name: string;
    exam_board: string;
    subject: string;
    year: number;
    total_marks: number;
    time_limit_minutes: number;
    questions: any[];
  };
}

export const MockExamResultsPage = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const { user } = useAuth();
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [previousAttempts, setPreviousAttempts] = useState<
    { id: string; percentage: number; completed_at: string }[]
  >([]);

  useEffect(() => {
    if (!user || !resultId) return;
    fetchResult();
    const interval = setInterval(fetchResult, 5000);
    return () => clearInterval(interval);
  }, [user, resultId]);

  const fetchResult = async () => {
    const { data, error } = await (supabase as any)
      .from("mock_results")
      .select("*, mock_papers(*)")
      .eq("id", resultId)
      .eq("user_id", user!.id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setResult(data as ExamResultData);

    // Stop polling once completed
    if (data.status === "completed") {
      // Fetch previous attempts for comparison
      const { data: prev } = await (supabase as any)
        .from("mock_results")
        .select("id, percentage, completed_at")
        .eq("user_id", user!.id)
        .eq("paper_id", data.paper_id)
        .eq("status", "completed")
        .neq("id", resultId)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (prev) setPreviousAttempts(prev);
    }

    setLoading(false);
  };

  const toggleQuestion = (qn: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qn)) next.delete(qn);
      else next.add(qn);
      return next;
    });
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const getScoreColor = (pct: number): string => {
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-amber-500";
    return "text-red-600";
  };

  const getQuestionColor = (awarded: number, available: number): string => {
    const pct = (awarded / available) * 100;
    if (pct >= 75) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (pct >= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavLinks />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavLinks />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Result not found.</p>
          <Link to="/mock-exam">
            <Button variant="brand" className="mt-4">
              Back to Mock Exams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Still marking
  if (result.status === "marking") {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavLinks />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Marking your exam...</h2>
          <p className="text-muted-foreground">
            The AI is reviewing each of your answers. This usually takes 30-60 seconds.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            {result.mock_papers.paper_name} · {result.mock_papers.exam_board}{" "}
            {result.mock_papers.year}
          </p>
        </div>
      </div>
    );
  }

  const qResults = result.question_results || [];
  const strongest = [...qResults]
    .filter((q) => q.marks_available > 0)
    .sort((a, b) => b.marks_awarded / b.marks_available - a.marks_awarded / a.marks_available)[0];
  const weakest = [...qResults]
    .filter((q) => q.marks_available > 0)
    .sort((a, b) => a.marks_awarded / a.marks_available - b.marks_awarded / b.marks_available)[0];

  return (
    <div className="min-h-screen bg-background">
      <Header showNavLinks />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          to="/mock-exam"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Exams
        </Link>

        {/* Paper info */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{result.mock_papers.exam_board}</Badge>
            <Badge variant="secondary">{result.mock_papers.year}</Badge>
          </div>
          <h1 className="text-2xl font-bold mt-2">{result.mock_papers.paper_name}</h1>
        </div>

        {/* Score overview */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p
                  className={`text-3xl font-extrabold ${getScoreColor(
                    result.percentage || 0
                  )}`}
                >
                  {result.total_score}/{result.max_score}
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div>
                <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p
                  className={`text-3xl font-extrabold ${getScoreColor(
                    result.percentage || 0
                  )}`}
                >
                  {result.percentage?.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Percentage</p>
              </div>
              <div>
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-3xl font-extrabold">
                  {result.time_taken_seconds ? formatTime(result.time_taken_seconds) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Time Taken</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold mt-6">
                  {qResults.filter((q) => q.marks_awarded > 0).length}/{qResults.length}
                </p>
                <p className="text-xs text-muted-foreground">Scored</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strongest/Weakest */}
        {strongest && weakest && strongest.question_number !== weakest.question_number && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Strongest</p>
                <p className="font-bold text-green-700 dark:text-green-400">
                  Q{strongest.question_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {strongest.marks_awarded}/{strongest.marks_available} marks
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Needs Work</p>
                <p className="font-bold text-red-700 dark:text-red-400">
                  Q{weakest.question_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {weakest.marks_awarded}/{weakest.marks_available} marks
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Previous attempts comparison */}
        {previousAttempts.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Previous Attempts on This Paper</p>
              <div className="flex gap-3 overflow-x-auto">
                {previousAttempts.map((a) => (
                  <Link key={a.id} to={`/mock-exam/${a.id}/results`}>
                    <div className="bg-muted rounded-lg px-3 py-2 text-center min-w-[80px] hover:bg-muted/80">
                      <p className="font-bold text-sm">{a.percentage?.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.completed_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-question breakdown */}
        <h2 className="text-lg font-bold mb-4">Question Breakdown</h2>
        <div className="space-y-3 mb-8">
          {qResults.map((qr) => {
            const isExpanded = expandedQuestions.has(qr.question_number);
            const paperQuestion = result.mock_papers.questions.find(
              (q: any) => q.question_number === qr.question_number
            );

            return (
              <Card key={qr.question_number}>
                <button
                  className="w-full text-left"
                  onClick={() => toggleQuestion(qr.question_number)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs ${getQuestionColor(qr.marks_awarded, qr.marks_available)}`}>
                        Q{qr.question_number}
                      </Badge>
                      <span className="font-bold text-sm">
                        {qr.marks_awarded}/{qr.marks_available}
                      </span>
                      {qr.level !== "N/A" && (
                        <span className="text-xs text-muted-foreground">{qr.level}</span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {/* Question text */}
                    {paperQuestion && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                          Question
                        </p>
                        <p className="text-sm">{paperQuestion.question_text}</p>
                      </div>
                    )}

                    {/* Student answer */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                        Your Answer
                      </p>
                      <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {result.answers[qr.question_number] || (
                          <span className="text-muted-foreground italic">No answer provided</span>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                        Examiner Feedback
                      </p>
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
                        {qr.feedback}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/mock-exam">
            <Button variant="brand">Try Another Paper</Button>
          </Link>
          <Link to={`/mock-exam`}>
            <Button variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Retake This Paper
            </Button>
          </Link>
          <Link to="/mock-exam/history">
            <Button variant="outline">View All Attempts</Button>
          </Link>
        </div>

        {/* Tab switches notice */}
        {result.tab_switches > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            You left the exam tab {result.tab_switches} time(s) during this attempt.
          </p>
        )}
      </div>
    </div>
  );
};
