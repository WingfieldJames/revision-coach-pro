import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { resolveCourse } from "@/lib/uni/catalogue";
import { loadFinalList } from "@/lib/uni/results";
import {
  emptyDraft,
  loadDraft,
  PS_CHAR_LIMIT,
  PS_QUESTIONS,
  saveDraft,
  totalChars,
  type PsDraft,
  type PsQuestionId,
} from "@/lib/uni/write";

/** The student's chosen courses, shown as context while they write. */
function useChosenCourses() {
  return useMemo(() => {
    const final = loadFinalList();
    if (!final || final.length === 0) return [];
    const byId = resolveCourse(final);
    return final
      .map((f) => byId.get(f.courseId))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
  }, []);
}

export const UniWritePage = () => {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<PsDraft>(emptyDraft);
  const chosen = useChosenCourses();

  // Read the draft on mount — the shell has already settled storage (server
  // work pulled in for the signed-in user), so we never show an empty form.
  useEffect(() => {
    setDraft(loadDraft());
    setMounted(true);
  }, []);

  function update(id: PsQuestionId, value: string) {
    setDraft((d) => {
      const next = { ...d, [id]: value };
      saveDraft(next);
      return next;
    });
  }

  if (!mounted) return null;

  const used = totalChars(draft);
  const over = used > PS_CHAR_LIMIT;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
      <div className="flex flex-col gap-16 pb-24">
        <div className="reveal-up reveal-delay-1 max-w-[640px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Your statement.
          </h1>
          <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
            Three questions, in your own words. Every word here is yours — we
            only give structure and feedback, never the writing itself.
          </p>

          {chosen.length > 0 ? (
            <div className="mt-6 flex items-center">
              <span aria-hidden="true" className="block h-px w-10 bg-primary" />
              <p className="ml-[14px] text-[15px] text-muted-foreground">
                Writing for{" "}
                <span className="text-foreground">
                  {chosen.map((c) => `${c.name}, ${c.university}`).join(" · ")}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-14">
          {PS_QUESTIONS.map((q, i) => (
            <section key={q.id} className="reveal-up reveal-delay-2">
              <label htmlFor={q.id} className="block max-w-[720px]">
                <span className="mb-3 block text-[14px] font-medium text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[26px] font-medium leading-[1.2] tracking-[-0.02em] text-foreground">
                  {q.title}
                </span>
              </label>
              <Textarea
                id={q.id}
                value={draft[q.id]}
                onChange={(e) => update(q.id, e.target.value)}
                rows={8}
                className="mt-4 max-w-[720px] resize-y rounded-2xl px-5 py-4 text-[17px] leading-[1.6] transition-colors duration-150 focus-visible:border-ring"
              />
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6 text-[15px]">
          <span className={over ? "text-destructive" : "text-muted-foreground"}>
            {used.toLocaleString()} of {PS_CHAR_LIMIT.toLocaleString()} characters
            {over ? " — over the UCAS limit" : ""}
          </span>
          <span className="text-muted-foreground">Saved as you type.</span>
        </div>
      </div>
    </main>
  );
};
