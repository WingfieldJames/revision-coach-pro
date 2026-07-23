import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { annotateCourse } from "@/lib/uni/annotate";
import { courseToSummary } from "@/lib/uni/catalogue";
import { loadInputs } from "@/lib/uni/intake";
import { gradesToPoints } from "@/lib/uni/points";
import {
  type MatchResult,
  requestOrder,
  requestReasons,
} from "@/lib/uni/ranking";
import { loadFinalList, saveFinalList } from "@/lib/uni/results";
import {
  inputsSignature,
  loadRankingSnapshot,
  saveRankingSnapshot,
} from "@/lib/uni/resultsCache";
import { groupIntoTiers, TIERS } from "@/lib/uni/tiers";
import type {
  AnnotatedCandidate,
  Course,
  MatchInputs,
} from "@/lib/uni/types";
import { AddCourse } from "@/components/university/results/AddCourse";
import { CourseCard } from "@/components/university/results/CourseCard";
import { SelectionBar } from "@/components/university/results/SelectionBar";
import { SkeletonCard } from "@/components/university/results/SkeletonCard";
import { ThinkingStatus } from "@/components/university/results/ThinkingStatus";

/** UCAS allows five course choices, so the carried-forward shortlist caps at five. */
const MAX_SELECTED = 5;

/** While reach is pending, show this many best-fit matches (the model still
 * considered the full candidate slice; we just surface the strongest). */
const INTERIM_DISPLAY_CAP = 12;

/** A candidate plus the reason shown for it and whether the student added it. */
type ResultCourse = AnnotatedCandidate & { reason: string; added: boolean };

const REVEAL_DELAY = [
  "reveal-delay-1",
  "reveal-delay-2",
  "reveal-delay-3",
] as const;

/**
 * Order candidates when no ordering is available (the call failed, or these are
 * the leftovers the ordering didn't return): fewest unmet requirements first,
 * then closest to the offer.
 */
function fallbackCompare(a: AnnotatedCandidate, b: AnnotatedCandidate): number {
  if (a.missingRequirements.length !== b.missingRequirements.length) {
    return a.missingRequirements.length - b.missingRequirements.length;
  }
  return Math.abs(a.pointsGap) - Math.abs(b.pointsGap);
}

/**
 * Apply the model's ordering to the candidates. Ordered courses come first, in
 * the model's order; any candidate the ordering omitted is appended in fallback
 * order. Reasons are filled in later, so every course starts without one.
 */
function orderCandidates(
  candidates: AnnotatedCandidate[],
  order: string[] | null,
): ResultCourse[] {
  if (!order || order.length === 0) {
    return [...candidates]
      .sort(fallbackCompare)
      .map((c) => ({ ...c, reason: "", added: false }));
  }

  const byId = new Map(candidates.map((c) => [c.course.id, c]));
  const used = new Set<string>();
  const ranked: ResultCourse[] = [];
  for (const id of order) {
    const candidate = byId.get(id);
    if (!candidate || used.has(id)) continue;
    used.add(id);
    ranked.push({ ...candidate, reason: "", added: false });
  }

  const leftover = candidates
    .filter((c) => !used.has(c.course.id))
    .sort(fallbackCompare)
    .map((c) => ({ ...c, reason: "", added: false }));

  return [...ranked, ...leftover];
}

export const UniResultsPage = () => {
  const [mounted, setMounted] = useState(false);
  const [inputs, setInputs] = useState<MatchInputs | null>(null);
  const [matched, setMatched] = useState<MatchResult | null>(null);
  const [orderError, setOrderError] = useState(false);
  const [orderSettled, setOrderSettled] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [finalList, setFinalList] = useState<ResultCourse[] | null>(null);
  // Course ids the student has picked for their top five, in the order chosen.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reasonsDone, setReasonsDone] = useState(false);
  const reasonsRequested = useRef(false);
  // Reasons restored from cache, seeded into the list as it builds.
  const seedReasonsRef = useRef<Record<string, string>>({});
  // True when this view was restored from a cached ranking (no model calls).
  const restoredRef = useRef(false);

  const studentPoints = useMemo(
    () => (inputs ? gradesToPoints(inputs.aLevels.map((a) => a.grade)) : 0),
    [inputs],
  );
  // Candidates come from the live DB via the uni-rank edge function; annotate
  // each (reach is unknown without offers) so ordering/rendering still applies.
  const candidates = useMemo(
    () =>
      matched && inputs
        ? matched.courses.map((c) => annotateCourse(c, studentPoints, inputs))
        : [],
    [matched, inputs, studentPoints],
  );
  const order = matched?.order ?? null;

  // On mount (storage already hydrated by the shell, user signed in), load
  // inputs and kick off the fast ordering call.
  useEffect(() => {
    const stored = loadInputs();
    setInputs(stored);
    setMounted(true);
    if (!stored) return;

    // Restore a cached ranking for these exact inputs instead of re-calling the
    // model — this is what stops the results page re-spending the rank + reasons
    // calls on every visit. A signature mismatch (the student changed their
    // answers) returns null, so we fall through to a fresh run.
    const snapshot = loadRankingSnapshot(stored);
    if (snapshot) {
      seedReasonsRef.current = snapshot.reasons;
      restoredRef.current = true;
      reasonsRequested.current = true; // reasons are cached — never refetch
      const savedSelection = loadFinalList();
      if (savedSelection) setSelectedIds(savedSelection.map((f) => f.courseId));
      setMatched(snapshot.matched);
      setReasonsDone(true);
      setOrderSettled(true);
      setAnimationDone(true); // no thinking animation on a restored view
      return;
    }

    let active = true;
    requestOrder(stored)
      .then((res) => {
        if (active) setMatched(res);
      })
      .catch(() => {
        if (active) setOrderError(true);
      })
      .finally(() => {
        if (active) setOrderSettled(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Reveal the tiers as soon as the ordering and the reveal animation settle.
  // Reasons are still loading at this point — they fill in afterwards.
  useEffect(() => {
    if (finalList || !inputs || !orderSettled || !animationDone) return;
    const ordered = orderCandidates(candidates, orderError ? null : order);
    // Reach is pending (no offers yet), so don't cap into reach tiers — show the
    // whole best-fit list. Once offers land, fall back to the 3-per-tier select.
    const reachKnown = ordered.some((rc) => rc.reachLevel !== "unknown");
    const selected = (
      reachKnown
        ? groupIntoTiers(ordered, { cap: 3 }).flatMap((g) => g.courses)
        : ordered.slice(0, INTERIM_DISPLAY_CAP)
    ).map((rc) => ({
      // Seed cached reasons when restoring; a fresh run has none here and fills
      // them in via the reasons fetch below.
      ...rc,
      reason: seedReasonsRef.current[rc.course.id] ?? rc.reason,
    }));
    setFinalList(selected);
  }, [
    finalList,
    inputs,
    orderSettled,
    animationDone,
    orderError,
    order,
    candidates,
  ]);

  // Once the shortlist is revealed, fetch one-line reasons for just those
  // courses and merge them in as they arrive. Fires once; edits don't re-fetch.
  useEffect(() => {
    if (!finalList || !inputs || reasonsRequested.current) return;
    reasonsRequested.current = true;
    if (orderError) {
      setReasonsDone(true);
      return;
    }

    let active = true;
    const ids = finalList.map((rc) => rc.course.id);
    requestReasons(inputs, ids)
      .then((reasons) => {
        if (!active) return;
        const byId = new Map(reasons.map((r) => [r.courseId, r.reason]));
        setFinalList((list) =>
          (list ?? []).map((rc) =>
            byId.has(rc.course.id)
              ? { ...rc, reason: byId.get(rc.course.id) ?? "" }
              : rc,
          ),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReasonsDone(true);
      });
    return () => {
      active = false;
    };
  }, [finalList, inputs, orderError]);

  // Cache the ranking (the model's order + the reasons as they arrive) so a
  // return visit restores it instead of re-spending the rank/reasons calls.
  // Skipped when we just restored — that ranking is already cached.
  useEffect(() => {
    // Save as soon as the order is in (covers leaving during the reveal), then
    // again as reasons fill in. Not gated on finalList so the costly rank is
    // cached even before the list renders.
    if (!inputs || !matched || restoredRef.current) return;
    const reasons: Record<string, string> = {};
    for (const rc of finalList ?? []) {
      if (!rc.added && rc.reason) reasons[rc.course.id] = rc.reason;
    }
    saveRankingSnapshot({ signature: inputsSignature(inputs), matched, reasons });
  }, [inputs, matched, finalList]);

  // Persist only the student's selected courses, in the order chosen, for the
  // personal statement stage. Selection — not the whole list — is what carries
  // forward, so a course must be both present and selected to be saved.
  useEffect(() => {
    if (!finalList) return;
    const byId = new Map(finalList.map((rc) => [rc.course.id, rc]));
    const chosen = selectedIds
      .map((id) => byId.get(id))
      .filter((rc): rc is ResultCourse => rc !== undefined)
      .map((rc) => ({
        courseId: rc.course.id,
        reachLevel: rc.reachLevel,
        reason: rc.reason,
        // Catalogue courses aren't in loadCourses(), so snapshot their display
        // data inline; downstream stages resolve them via resolveCourse().
        ...(rc.course.source === "catalogue"
          ? { course: courseToSummary(rc.course) }
          : {}),
      }));
    saveFinalList(chosen);
  }, [finalList, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= MAX_SELECTED) return ids;
      return [...ids, id];
    });
  }

  function handleRemove(id: string) {
    setFinalList((list) => (list ?? []).filter((rc) => rc.course.id !== id));
    // A removed course can't stay in the selection.
    setSelectedIds((ids) => ids.filter((x) => x !== id));
  }

  function handleAdd(course: Course) {
    if (!inputs) return;
    setFinalList((list) => {
      const current = list ?? [];
      if (current.some((rc) => rc.course.id === course.id)) return current;
      const annotated = annotateCourse(course, studentPoints, inputs);
      return [...current, { ...annotated, reason: "", added: true }];
    });
  }

  if (!mounted) return null;

  if (!inputs) {
    return (
      <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
        <div className="reveal-up reveal-delay-1 max-w-[480px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Nothing to match yet.
          </h1>
          <p className="mt-4 text-[18px] text-muted-foreground">
            Start with a few questions and we&apos;ll find your courses.
          </p>
          <Button
            asChild
            variant="brand"
            size="xl"
            className="mt-8 rounded-full px-8"
          >
            <Link to="/university/match">Start matching →</Link>
          </Button>
        </div>
      </main>
    );
  }

  const loading = !finalList;
  const grouped = finalList ? groupIntoTiers(finalList) : [];
  const existingIds = finalList ? finalList.map((rc) => rc.course.id) : [];
  // Interim: with no offers, every match has unknown reach — show one best-fit
  // list ("reach pending") instead of two empty reach columns.
  const reachPending =
    !!finalList &&
    finalList.length > 0 &&
    finalList.every((rc) => rc.reachLevel === "unknown");
  const matchTotal = matched?.total ?? 0;
  // While reasons are in flight, model-picked cards without one yet show a
  // quiet placeholder rather than a blank space.
  const reasonsPending = !reasonsDone && !orderError;

  const selectionFull = selectedIds.length >= MAX_SELECTED;
  // The chosen courses, in selection order, for the sticky summary bar.
  const byId = new Map((finalList ?? []).map((rc) => [rc.course.id, rc]));
  const selectedCourses = selectedIds
    .map((id) => byId.get(id))
    .filter((rc): rc is ResultCourse => rc !== undefined)
    .map((rc) => ({
      courseId: rc.course.id,
      name: rc.course.name,
      university: rc.course.university,
    }));

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
      <div className="flex flex-col gap-16 pb-40">
        <div className="reveal-up reveal-delay-1 max-w-[640px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Your shortlist.
          </h1>
          {loading ? (
            <ThinkingStatus
              courseCount={matchTotal}
              matchCount={candidates.length}
              ready={orderSettled}
              onDone={() => setAnimationDone(true)}
            />
          ) : reachPending ? (
            <>
              <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
                Your closest matches, best fit first. We&apos;ll group these by
                how reachable each one is once we have your predicted grades —
                for now, reach is pending. Select up to five, remove any, or add
                one you already want.
              </p>
              {matchTotal > finalList!.length ? (
                <p className="mt-4 text-[15px] text-muted-foreground">
                  Showing the top {finalList!.length} of {matchTotal} matches.
                </p>
              ) : null}
              {orderError ? (
                <p className="mt-4 text-[15px] text-muted-foreground">
                  We couldn&apos;t load the tailored notes this time, so these
                  are ordered by the facts alone.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
                Grouped by how reachable each course is at your predicted
                grades. We advise; you decide — select up to five to take
                forward, remove any course, or add one you already want.
              </p>
              {orderError ? (
                <p className="mt-4 text-[15px] text-muted-foreground">
                  We couldn&apos;t load the tailored notes this time, so these
                  are ordered by the facts alone.
                </p>
              ) : null}
            </>
          )}
          {!loading && finalList && finalList.length > 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">
              Reach bands appear only where we&apos;ve verified the
              university&apos;s typical offer.
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 min-[860px]:grid-cols-3">
            {TIERS.map((tier) => (
              <section key={tier.id} className="flex flex-col">
                <div className="mb-5 flex items-center">
                  <span
                    aria-hidden="true"
                    className="block h-px w-10 bg-primary"
                  />
                  <h2 className="ml-[14px] text-[16px] font-medium text-primary">
                    {tier.heading}
                  </h2>
                </div>
                <div className="flex flex-col">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </section>
            ))}
          </div>
        ) : finalList!.length === 0 ? (
          <p className="border-t border-border pt-8 text-[17px] text-muted-foreground">
            None of our courses match what you told us yet. Try choosing more
            course types.
          </p>
        ) : reachPending ? (
          <div className="reveal-up reveal-delay-1 grid grid-cols-1 gap-x-10 min-[860px]:grid-cols-3">
            {finalList!.map((rc) => {
              const isSelected = selectedIds.includes(rc.course.id);
              return (
                <CourseCard
                  key={rc.course.id}
                  candidate={rc}
                  reason={rc.reason}
                  added={rc.added}
                  reasonPending={reasonsPending && !rc.added && rc.reason === ""}
                  selected={isSelected}
                  selectionDisabled={selectionFull && !isSelected}
                  onToggleSelect={() => toggleSelect(rc.course.id)}
                  onRemove={() => handleRemove(rc.course.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 min-[860px]:grid-cols-3">
            {grouped.map((group, i) => (
              <section
                key={group.tier.id}
                className={`reveal-up ${REVEAL_DELAY[i]} flex flex-col`}
              >
                <div className="mb-5 flex items-center">
                  <span
                    aria-hidden="true"
                    className="block h-px w-10 bg-primary"
                  />
                  <h2 className="ml-[14px] text-[16px] font-medium text-primary">
                    {group.tier.heading}
                  </h2>
                </div>

                {group.courses.length === 0 ? (
                  <p className="border-t border-border pt-5 text-[15px] text-muted-foreground">
                    {group.tier.blurbWhenThin}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col">
                      {group.courses.map((rc) => {
                        const isSelected = selectedIds.includes(rc.course.id);
                        return (
                          <CourseCard
                            key={rc.course.id}
                            candidate={rc}
                            reason={rc.reason}
                            added={rc.added}
                            reasonPending={
                              reasonsPending && !rc.added && rc.reason === ""
                            }
                            selected={isSelected}
                            selectionDisabled={selectionFull && !isSelected}
                            onToggleSelect={() => toggleSelect(rc.course.id)}
                            onRemove={() => handleRemove(rc.course.id)}
                          />
                        );
                      })}
                    </div>
                    {group.isThin ? (
                      <p className="border-t border-border pt-5 text-[14px] text-muted-foreground">
                        {group.tier.blurbWhenThin}
                      </p>
                    ) : null}
                  </>
                )}
              </section>
            ))}
          </div>
        )}

        {!loading ? (
          <div className="reveal-up reveal-delay-3 border-t border-border pt-12">
            <AddCourse existingIds={existingIds} onAdd={handleAdd} />
          </div>
        ) : null}

        {finalList && finalList.length > 0 ? (
          <SelectionBar selected={selectedCourses} max={MAX_SELECTED} />
        ) : null}
      </div>
    </main>
  );
};
