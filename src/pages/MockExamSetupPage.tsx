import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, FileText, Hash, AlertTriangle, ChevronRight, History } from "lucide-react";
import { Link } from "react-router-dom";

interface MockPaper {
  id: string;
  exam_board: string;
  subject: string;
  paper_number: number;
  paper_name: string;
  year: number;
  total_marks: number;
  time_limit_minutes: number;
  sections: any[];
  questions: any[];
}

export const MockExamSetupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<MockPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<MockPaper | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  // Filters
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("mock_papers")
      .select("*")
      .eq("active", true)
      .order("year", { ascending: false });

    if (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to load papers");
    } else {
      setPapers(data || []);
    }
    setLoading(false);
  };

  const boards = [...new Set(papers.map((p) => p.exam_board))];
  const subjects = [...new Set(papers.map((p) => p.subject))];

  const filteredPapers = papers.filter((p) => {
    if (boardFilter !== "all" && p.exam_board !== boardFilter) return false;
    if (subjectFilter !== "all" && p.subject !== subjectFilter) return false;
    return true;
  });

  const handleStartExam = async () => {
    if (!user || !selectedPaper) {
      toast.error("Please sign in to take a mock exam");
      return;
    }

    setStarting(true);
    try {
      // Check for existing in-progress attempt
      const { data: existing } = await (supabase as any)
        .from("mock_results")
        .select("id, started_at")
        .eq("user_id", user.id)
        .eq("paper_id", selectedPaper.id)
        .eq("status", "in_progress")
        .maybeSingle();

      if (existing) {
        // Resume existing attempt
        navigate(`/mock-exam/${existing.id}`);
        return;
      }

      // Create new result record
      const { data: result, error } = await (supabase as any)
        .from("mock_results")
        .insert({
          user_id: user.id,
          paper_id: selectedPaper.id,
          product_id: selectedPaper.product_id || null,
          max_score: selectedPaper.total_marks,
          answers: {},
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/mock-exam/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start exam");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Mock Exams | A* AI" description="Take a full timed mock exam with AI auto-marking." />
      <Header showNavLinks />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mock Exams</h1>
            <p className="text-muted-foreground mt-1">Full timed papers with AI auto-marking</p>
          </div>
          <Link to="/mock-exam/history">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" /> Past Attempts
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={boardFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setBoardFilter("all")}
          >
            All Boards
          </Button>
          {boards.map((b) => (
            <Button
              key={b}
              variant={boardFilter === b ? "default" : "outline"}
              size="sm"
              onClick={() => setBoardFilter(b)}
            >
              {b}
            </Button>
          ))}
          {subjects.length > 1 && (
            <>
              <span className="text-muted-foreground px-2">|</span>
              {subjects.map((s) => (
                <Button
                  key={s}
                  variant={subjectFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubjectFilter(subjectFilter === s ? "all" : s)}
                >
                  {s}
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Paper cards */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No mock papers available yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedPaper(paper);
                  setConfirmOpen(true);
                }}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {paper.exam_board}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {paper.year}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base">{paper.paper_name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {paper.questions.length} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {paper.total_marks} marks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {paper.time_limit_minutes} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Start confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ready to start?
            </DialogTitle>
          </DialogHeader>
          {selectedPaper && (
            <div className="space-y-4 mt-2">
              <div>
                <h3 className="font-bold">{selectedPaper.paper_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPaper.exam_board} · {selectedPaper.year}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{selectedPaper.questions.length}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{selectedPaper.total_marks}</p>
                  <p className="text-xs text-muted-foreground">Marks</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{selectedPaper.time_limit_minutes}</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your timer starts when you click <strong>Begin Exam</strong>. You can submit early, but the exam will auto-submit when time runs out.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  className="flex-1"
                  onClick={handleStartExam}
                  disabled={starting}
                >
                  {starting ? "Starting..." : "Begin Exam"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
