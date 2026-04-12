import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, Trophy, FileText, Loader2 } from "lucide-react";

interface HistoryItem {
  id: string;
  total_score: number | null;
  max_score: number;
  percentage: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  mock_papers: {
    paper_name: string;
    exam_board: string;
    year: number;
    total_marks: number;
  };
}

export const MockExamHistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data, error } = await (supabase as any)
      .from("mock_results")
      .select("*, mock_papers(paper_name, exam_board, year, total_marks)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) setHistory(data as HistoryItem[]);
    setLoading(false);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getScoreColor = (pct: number | null): string => {
    if (pct === null) return "text-muted-foreground";
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Mock Exam History | A* AI" description="View your past mock exam attempts and results." />
      <Header showNavLinks />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/mock-exam"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Exams
        </Link>

        <h1 className="text-2xl font-bold mb-6">Your Mock Exam History</h1>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No mock exams taken yet.</p>
              <Link to="/mock-exam">
                <Button variant="brand">Start a Mock Exam</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Link
                key={item.id}
                to={
                  item.status === "in_progress"
                    ? `/mock-exam/${item.id}`
                    : `/mock-exam/${item.id}/results`
                }
              >
                <Card className="hover:border-primary/50 transition-colors mb-3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.mock_papers.exam_board}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {item.mock_papers.year}
                        </Badge>
                        {item.status === "in_progress" && (
                          <Badge className="text-xs bg-amber-100 text-amber-800">In Progress</Badge>
                        )}
                        {item.status === "marking" && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Marking
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm">{item.mock_papers.paper_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(item.started_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {item.time_taken_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.time_taken_seconds)}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.status === "completed" && item.total_score !== null && (
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getScoreColor(item.percentage)}`}>
                          {item.percentage?.toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.total_score}/{item.max_score}
                        </p>
                      </div>
                    )}

                    {item.status === "in_progress" && (
                      <Button variant="brand" size="sm">
                        Resume
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
