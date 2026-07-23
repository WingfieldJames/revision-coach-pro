import { useEffect, useState } from "react";

interface ThinkingStatusProps {
  courseCount: number;
  matchCount: number;
  /** True once the ranking call has returned — lets the bar finish and reveal. */
  ready: boolean;
  onDone: () => void;
}

const STEP_MS = 1100;
const MIN_VISIBLE_MS = 1200;
const FINAL_BEAT_MS = 320;

/**
 * The inline "the AI is working" status, sitting under the results heading while
 * the columns hold skeleton cards: a cycling headline plus a quieter sub-line of
 * detail, above a hairline rule. It keeps whirring — cycling text, bar eased to
 * ~90% with a live dot — until the ranking call is `ready`, then fills to 100%
 * and calls `onDone` (after a small minimum so a fast response doesn't flash).
 */
export function ThinkingStatus({
  courseCount,
  matchCount,
  ready,
  onDone,
}: ThinkingStatusProps) {
  const steps = [
    {
      line: "Reading your A-levels and grades",
      sub: "Adding up your predicted UCAS points",
    },
    {
      line: `Scanning ${courseCount} courses`,
      sub: "Matching course types to what you chose",
    },
    {
      line: "Assessing entry requirements",
      sub: "Checking required subjects against yours, honestly",
    },
    {
      line: "Weighing what matters to you",
      sub: "Reading your notes on location, style and ambition",
    },
    {
      line: matchCount === 1 ? "Shaping your match" : "Shaping your matches",
      sub: "Ordering by fit, including the ones that are a stretch",
    },
    {
      line: "Comparing offers across your matches",
      sub: "Lining up typical offers against your grades",
    },
    {
      line: "Arranging your shortlist",
      sub: "Almost there — grouping by how reachable each one is",
    },
  ];

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"start" | "whirring" | "done">("start");
  const [minElapsed, setMinElapsed] = useState(false);

  // Reduced motion: skip the animation, but still wait for the data.
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    // Ease the bar off zero on the next tick so the CSS transition runs.
    const kick = setTimeout(() => setPhase("whirring"), 30);
    const min = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    // Cycle text on a loop so it never stalls while the wait continues.
    const cycle = setInterval(
      () => setIndex((i) => (i + 1) % steps.length),
      STEP_MS,
    );
    return () => {
      clearTimeout(kick);
      clearTimeout(min);
      clearInterval(cycle);
    };
    // Steps derive from stable props; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  // Complete once the data is ready (and, with motion, the minimum has elapsed).
  useEffect(() => {
    if (!ready) return;
    if (prefersReduced) {
      onDone();
      return;
    }
    if (!minElapsed) return;
    setPhase("done");
    const beat = setTimeout(onDone, FINAL_BEAT_MS);
    return () => clearTimeout(beat);
  }, [ready, minElapsed, prefersReduced, onDone]);

  const barWidth =
    phase === "done" ? "w-full" : phase === "whirring" ? "w-[88%]" : "w-0";
  // Hold short of full while whirring (slow ease); snap to full on done.
  const barEase =
    phase === "done"
      ? "duration-[320ms] ease-out"
      : "duration-[6000ms] ease-out";

  return (
    <div role="status" aria-live="polite" aria-busy={!ready} className="mt-4">
      <p
        key={index}
        className="fade-in text-[clamp(22px,3vw,30px)] font-medium leading-[1.15] tracking-[-0.02em] text-foreground"
      >
        {steps[index].line}
      </p>

      <div className="mt-5 h-px w-full max-w-[420px] bg-border">
        <div
          className={`relative h-px bg-primary transition-[width] ${barEase} ${barWidth}`}
        >
          <span
            aria-hidden="true"
            className={`absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary ${
              phase === "done" ? "" : "motion-safe:animate-pulse"
            }`}
          />
        </div>
      </div>

      <p key={`sub-${index}`} className="fade-in mt-3 text-[14px] text-muted-foreground">
        {steps[index].sub}
      </p>
    </div>
  );
}
