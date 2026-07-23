import { useEffect, useState } from "react";

interface OrganiseThinkingProps {
  /** True once the arrange call has returned — lets the bar finish and reveal. */
  ready: boolean;
  onDone: () => void;
}

const STEP_MS = 1100;
const MIN_VISIBLE_MS = 1200;
const FINAL_BEAT_MS = 320;

const STEPS = [
  {
    line: "Reading your material",
    sub: "Going through everything you gathered, one card at a time",
  },
  {
    line: "Routing each item into a question",
    sub: "Reading the reflection, not just the type",
  },
  {
    line: "Weighing it for your most ambitious course",
    sub: "The statement has to satisfy the hardest reader on your shortlist",
  },
  {
    line: "Ordering each question, strongest first",
    sub: "Leading with your most specific evidence",
  },
  {
    line: "Checking for gaps",
    sub: "Almost there — looking for what's thin or missing",
  },
];

/**
 * The inline "we're arranging" status, in the spirit of the matcher's
 * ThinkingStatus: a cycling serif line and a quieter sub-line above a red
 * hairline that eases toward full. It whirrs until the arrange call is `ready`,
 * then fills and calls `onDone` (after a small minimum so a fast call doesn't
 * flash). Reduced motion: skip the animation, still wait for the data.
 */
export function OrganiseThinking({ ready, onDone }: OrganiseThinkingProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"start" | "whirring" | "done">("start");
  const [minElapsed, setMinElapsed] = useState(false);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    const kick = setTimeout(() => setPhase("whirring"), 30);
    const min = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const cycle = setInterval(
      () => setIndex((i) => (i + 1) % STEPS.length),
      STEP_MS,
    );
    return () => {
      clearTimeout(kick);
      clearTimeout(min);
      clearInterval(cycle);
    };
  }, [prefersReduced]);

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
        {STEPS[index].line}
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
        {STEPS[index].sub}
      </p>
    </div>
  );
}
