import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { FirmChoiceBadge } from "@/components/university/FirmChoiceBadge";
import { ORGANISE_STORAGE_KEY } from "@/lib/uni/constants";
import { isComplete, loadInputs } from "@/lib/uni/intake";
import { loadPool } from "@/lib/uni/prepare";
import { loadFinalList } from "@/lib/uni/results";
import { loadDraft, totalChars } from "@/lib/uni/write";

type StageStatus = "not-started" | "in-progress" | "done";

interface Stage {
  to: string;
  label: string;
  blurb: string;
  status: StageStatus;
}

const STATUS_LABEL: Record<StageStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
};

const STATUS_CHIP: Record<StageStatus, string> = {
  "not-started": "border-border text-muted-foreground",
  "in-progress": "border-primary/40 bg-primary/10 text-primary",
  done: "border-primary bg-primary text-primary-foreground",
};

const RESUME_LABEL: Record<StageStatus, string> = {
  "not-started": "Start",
  "in-progress": "Continue",
  done: "Revisit",
};

/**
 * Derive each stage's status from the same storage the stage views read.
 * Renders post-hydration (the /university shell gates on useUniSync), so the
 * synchronous sessionStorage-backed load* helpers are safe here.
 */
function computeStages(): Stage[] {
  const inputs = loadInputs();
  const finalList = loadFinalList();
  const pool = loadPool();
  const draft = loadDraft();
  const arranged =
    typeof window !== "undefined" &&
    sessionStorage.getItem(ORGANISE_STORAGE_KEY) !== null;

  // Match: saved inputs at all → started; a complete set of answers → done.
  const match: StageStatus =
    inputs === null ? "not-started" : isComplete(inputs) ? "done" : "in-progress";
  // Results: a saved list exists once the results view runs; done means the
  // student has actually selected courses to carry forward.
  const results: StageStatus =
    finalList === null
      ? "not-started"
      : finalList.length > 0
        ? "done"
        : "in-progress";
  // Prepare: done at 4+ items — the same "thin pool" threshold the prepare
  // stage nudges the student past before shaping.
  const prepare: StageStatus =
    pool.length === 0 ? "not-started" : pool.length >= 4 ? "done" : "in-progress";
  // Write: any typed character → started; done when all three answers have
  // content and the combined draft clears UCAS's 350-character minimum.
  const chars = totalChars(draft);
  const allAnswered =
    draft.why.trim() !== "" &&
    draft.qualifications.trim() !== "" &&
    draft.experience.trim() !== "";
  const write: StageStatus =
    chars === 0
      ? "not-started"
      : allAnswered && chars >= 350
        ? "done"
        : "in-progress";
  // Organise: the arrangement is saved in one go when the student accepts the
  // board, so it is either done or not yet run.
  const organise: StageStatus = arranged ? "done" : "not-started";

  return [
    {
      to: "/university/match",
      label: "Match",
      blurb: "Tell us your subjects, grades and what matters to you.",
      status: match,
    },
    {
      to: "/university/results",
      label: "Results",
      blurb: "A ranked shortlist of courses that actually fit.",
      status: results,
    },
    {
      to: "/university/prepare",
      label: "Prepare",
      blurb: "Bank your reading, work experience and projects.",
      status: prepare,
    },
    {
      to: "/university/write",
      label: "Write",
      blurb: "Draft the three UCAS questions — your words, not AI's.",
      status: write,
    },
    {
      to: "/university/organise",
      label: "Organise",
      blurb: "Sort your material into the right questions.",
      status: organise,
    },
  ];
}

export const UniversityLandingPage = () => {
  const stages = useMemo(computeStages, []);
  const anyProgress = stages.some((s) => s.status !== "not-started");
  const firstUnfinished = stages.find((s) => s.status !== "done");

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
      <SEOHead
        title="University Applications — Course Matching & Personal Statement | A*AI"
        description="Find courses you'll actually get into, then organise everything you've done into the three UCAS personal statement questions. Free with your A*AI account."
        canonical="/university"
      />

      {/* Hero */}
      <div className="max-w-[720px]">
        <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
          Get the offer you actually want.
        </h1>
        <p className="mt-4 max-w-[640px] text-[18px] leading-[1.5] text-muted-foreground">
          Find courses you&apos;ll actually get into, build your material, and
          organise it for the three UCAS questions — free with your A*AI
          account.
        </p>
        <div className="mt-5">
          <FirmChoiceBadge />
        </div>
        <div className="mt-8">
          {anyProgress ? (
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={firstUnfinished?.to ?? "/university/write"}>
                Continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/university/match">
                Start matching
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stage cards */}
      <div className="mt-12 grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {stages.map((stage) => (
          <Link key={stage.to} to={stage.to} className="group block h-full">
            <Card className="h-full transition-colors duration-150 group-hover:border-primary/60">
              <CardContent className="flex h-full min-h-[160px] flex-col justify-between gap-4 p-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[20px] font-medium text-foreground">
                      {stage.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[stage.status]}`}
                    >
                      {STATUS_LABEL[stage.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
                    {stage.blurb}
                  </p>
                </div>
                <span className="text-sm font-medium text-primary">
                  {RESUME_LABEL[stage.status]}{" "}
                  <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Honesty panel */}
      <Card className="mt-12 max-w-[820px] bg-muted/50">
        <CardContent className="p-6">
          <p className="text-[15px] leading-[1.6] text-muted-foreground">
            Our course catalogue comes from the official Discover Uni dataset —
            every full-time course at 28 leading UK universities.
            Entry-requirement data is verified by hand, and we only show an
            offer once we&apos;ve checked it against the university&apos;s own
            pages. Where an offer hasn&apos;t been verified yet, we say so
            rather than guess.
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
