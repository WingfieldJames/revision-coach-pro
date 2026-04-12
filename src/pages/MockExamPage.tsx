import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle, Circle, AlertTriangle, Send } from "lucide-react";

interface Question {
  question_number: string;
  question_text: string;
  marks_available: number;
  question_type: string;
  section?: string;
  extract_text?: string;
  diagram_required?: boolean;
  options?: string[];
}

interface ExamResult {
  id: string;
  paper_id: string;
  answers: Record<string, string>;
  status: string;
  started_at: string;
  time_taken_seconds: number;
  tab_switches: number;
  mock_papers: {
    paper_name: string;
    exam_board: string;
    subject: string;
    year: number;
    total_marks: number;
    time_limit_minutes: number;
    questions: Question[];
    sections: any[];
  };
}

export const MockExamPage = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Fetch exam data
  useEffect(() => {
    if (!user || !resultId) return;
    fetchExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveRef.current) clearInterval(saveRef.current);
    };
  }, [user, resultId]);

  const fetchExam = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("mock_results")
      .select("*, mock_papers(*)")
      .eq("id", resultId)
      .eq("user_id", user!.id)
      .single();

    if (error || !data) {
      toast.error("Exam not found");
      navigate("/mock-exam");
      return;
    }

    if (data.status !== "in_progress") {
      navigate(`/mock-exam/${resultId}/results`);
      return;
    }

    setExam(data as ExamResult);
    setAnswers(data.answers || {});
    setTabSwitches(data.tab_switches || 0);

    // Calculate time remaining
    const startedAt = new Date(data.started_at).getTime();
    const timeLimitMs = data.mock_papers.time_limit_minutes * 60 * 1000;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, Math.floor((timeLimitMs - elapsed) / 1000));

    if (remaining <= 0) {
      // Time already expired — auto-submit
      handleSubmit(true, data.answers || {});
    } else {
      setTimeLeft(remaining);
      startTimer();
    }

    setLoading(false);
  };

  // Timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setAutoSubmitted(true);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!exam || exam.status !== "in_progress") return;
    saveRef.current = setInterval(() => {
      saveAnswers(answersRef.current);
    }, 30000);
    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
    };
  }, [exam]);

  const saveAnswers = async (currentAnswers: Record<string, string>) => {
    if (!resultId) return;
    await (supabase as any)
      .from("mock_results")
      .update({ answers: currentAnswers, tab_switches: tabSwitches })
      .eq("id", resultId);
  };

  // Track tab switches
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && exam?.status === "in_progress") {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [exam]);

  // Update answer
  const updateAnswer = useCallback(
    (questionNumber: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionNumber]: value }));
    },
    []
  );

  // Submit exam
  const handleSubmit = async (isAutoSubmit = false, overrideAnswers?: Record<string, string>) => {
    if (submitting) return;
    setSubmitting(true);

    const finalAnswers = overrideAnswers || answersRef.current;

    try {
      // Save final answers and update status
      const startedAt = exam ? new Date(exam.started_at).getTime() : Date.now();
      const timeTaken = Math.round((Date.now() - startedAt) / 1000);

      await (supabase as any)
        .from("mock_results")
        .update({
          answers: finalAnswers,
          status: "marking",
          time_taken_seconds: timeTaken,
          tab_switches: tabSwitches,
        })
        .eq("id", resultId);

      // Stop timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveRef.current) clearInterval(saveRef.current);

      if (isAutoSubmit) {
        toast.info("Time's up! Your exam has been submitted for marking.");
      } else {
        toast.success("Exam submitted! Marking in progress...");
      }

      // Trigger marking
      const { data: { session } } = await supabase.auth.getSession();
      supabase.functions.invoke("mock-exam-mark", {
        body: { result_id: resultId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      // Navigate to results (will show marking progress)
      navigate(`/mock-exam/${resultId}/results`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit exam");
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Timer color
  const getTimerColor = (): string => {
    if (!exam) return "text-green-600";
    const totalSeconds = exam.mock_papers.time_limit_minutes * 60;
    const pct = timeLeft / totalSeconds;
    if (pct > 0.5) return "text-green-600";
    if (pct > 0.25) return "text-amber-500";
    return "text-red-600 animate-pulse";
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-3">Loading exam...</p>
        </div>
      </div>
    );
  }

  const questions: Question[] = exam.mock_papers.questions;
  const current = questions[currentQuestion];
  const answeredCount = questions.filter(
    (q) => (answers[q.question_number] || "").trim().length > 0
  ).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar — timer + progress */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {exam.mock_papers.paper_name}
            </span>
            <Badge variant="outline" className="text-xs">
              {answeredCount}/{questions.length} answered
            </Badge>
          </div>

          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimerColor()}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          <Button
            variant="brand"
            size="sm"
            onClick={() => setSubmitOpen(true)}
            disabled={submitting}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Submit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Question navigation sidebar */}
        <div className="w-16 sm:w-20 border-r border-border flex flex-col items-center py-4 gap-1.5 overflow-y-auto">
          {questions.map((q, idx) => {
            const isAnswered = (answers[q.question_number] || "").trim().length > 0;
            const isCurrent = idx === currentQuestion;
            return (
              <button
                key={q.question_number}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isAnswered
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                title={`Q${q.question_number} (${q.marks_available} marks)`}
              >
                {q.question_number}
              </button>
            );
          })}
        </div>

        {/* Main question area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {current && (
            <div className="max-w-3xl">
              {/* Question header */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-xs">
                  Question {current.question_number}
                </Badge>
                <Badge className="text-xs">{current.marks_available} marks</Badge>
                <Badge variant="secondary" className="text-xs">
                  {current.question_type}
                </Badge>
                {current.diagram_required && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                    Diagram expected
                  </Badge>
                )}
              </div>

              {/* Extract text if present */}
              {current.extract_text && (
                <div className="bg-muted rounded-lg p-4 mb-4 text-sm border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                    Extract
                  </p>
                  <p className="whitespace-pre-wrap">{current.extract_text}</p>
                </div>
              )}

              {/* Question text */}
              <p className="text-base sm:text-lg font-medium mb-4 leading-relaxed">
                {current.question_text}
              </p>

              {/* Answer input — MC or written */}
              {current.options && current.options.length > 0 ? (
                <div className="space-y-2">
                  {current.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const selected = answers[current.question_number] === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => updateAnswer(current.question_number, letter)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="font-bold mr-2">{letter}.</span>
                        {opt}
                      </button>
                    );
                  })}
                  <div className="flex justify-end mt-1 text-xs text-muted-foreground">
                    {(answers[current.question_number] || "").trim().length > 0 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" /> Answered: {answers[current.question_number]}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Circle className="h-3 w-3" /> Unanswered
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    value={answers[current.question_number] || ""}
                    onChange={(e) => updateAnswer(current.question_number, e.target.value)}
                    placeholder="Type your answer here..."
                    className={`w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y ${
                      current.marks_available >= 15
                        ? "min-h-[400px]"
                        : current.marks_available >= 8
                        ? "min-h-[250px]"
                        : "min-h-[150px]"
                    }`}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {(answers[current.question_number] || "")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length}{" "}
                      words
                    </span>
                    <span>
                      {(answers[current.question_number] || "").trim().length > 0 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" /> Answered
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Circle className="h-3 w-3" /> Unanswered
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion((prev) => prev - 1)}
                >
                  Previous
                </Button>
                {currentQuestion < questions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>
                    Next Question
                  </Button>
                ) : (
                  <Button variant="brand" onClick={() => setSubmitOpen(true)}>
                    Review & Submit
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit confirmation */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Submit your exam?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Answered:</span>{" "}
                  <span className="font-bold">
                    {answeredCount}/{questions.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time left:</span>{" "}
                  <span className="font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {answeredCount < questions.length && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You have{" "}
                  <strong>{questions.length - answeredCount} unanswered question(s)</strong>.
                  Unanswered questions will receive 0 marks.
                </p>
              </div>
            )}

            {tabSwitches > 0 && (
              <p className="text-xs text-muted-foreground">
                You left the exam tab {tabSwitches} time(s).
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSubmitOpen(false)}>
                Keep working
              </Button>
              <Button
                variant="brand"
                className="flex-1"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
