import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { ALL_MOCK_PAPERS } from "@/data/mockPapers";

export const AdminSeedPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const runSeed = async () => {
    setStatus("running");
    setLog([]);

    try {
      addLog("Checking mock_papers table...");
      const { error: tableCheck } = await (supabase as any).from("mock_papers").select("id").limit(1);
      if (tableCheck) {
        addLog(`ERROR: Table doesn't exist. Run the CREATE TABLE SQL in Supabase SQL Editor first.`);
        addLog(`Error: ${tableCheck.message}`);
        setStatus("error");
        return;
      }
      addLog("Table exists.");

      let inserted = 0;
      let skipped = 0;

      for (const paper of ALL_MOCK_PAPERS) {
        const { data: existing } = await (supabase as any)
          .from("mock_papers")
          .select("id")
          .eq("exam_board", paper.exam_board)
          .eq("subject", paper.subject)
          .eq("paper_number", paper.paper_number)
          .eq("year", paper.year)
          .maybeSingle();

        if (existing) {
          addLog(`SKIP: ${paper.paper_name} (exists)`);
          skipped++;
          continue;
        }

        const { data: product } = await (supabase as any)
          .from("products")
          .select("id")
          .eq("slug", (paper as any).product_slug)
          .maybeSingle();

        const { error } = await (supabase as any).from("mock_papers").insert({
          exam_board: paper.exam_board,
          subject: paper.subject,
          paper_number: paper.paper_number,
          paper_name: paper.paper_name,
          year: paper.year,
          total_marks: paper.total_marks,
          time_limit_minutes: paper.time_limit_minutes,
          content_source: "representative",
          sections: paper.sections,
          questions: paper.questions,
          product_id: product?.id || null,
          active: true,
        });

        if (error) {
          addLog(`FAIL: ${paper.paper_name} — ${error.message}`);
        } else {
          addLog(`OK: ${paper.paper_name}`);
          inserted++;
        }
      }

      addLog(`\nDone: ${inserted} inserted, ${skipped} skipped, ${ALL_MOCK_PAPERS.length} total`);
      setStatus("done");
    } catch (err: any) {
      addLog(`FATAL: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6">
          <h1 className="text-xl font-bold mb-2">Seed Mock Papers</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Inserts {ALL_MOCK_PAPERS.length} papers across all subjects (including MCQ papers for AQA Economics P3, CIE Economics P1, OCR Physics P1/P2, AQA Chemistry P3, AQA Psychology P1). Safe to run repeatedly.
          </p>

          {status === "idle" && (
            <Button variant="brand" onClick={runSeed}>Seed All Papers</Button>
          )}
          {status === "running" && (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Seeding...</div>
          )}
          {status === "done" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Complete! Mock Exams should now work for all subjects.
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" /> See log below.
            </div>
          )}

          {log.length > 0 && (
            <pre className="mt-4 bg-muted rounded-lg p-3 text-xs max-h-96 overflow-y-auto whitespace-pre-wrap">
              {log.join("\n")}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
