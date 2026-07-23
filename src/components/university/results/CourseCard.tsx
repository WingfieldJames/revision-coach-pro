import { formatRequirement, REACH_LABEL } from "@/lib/uni/tiers";
import type { AnnotatedCandidate } from "@/lib/uni/types";

interface CourseCardProps {
  candidate: AnnotatedCandidate;
  reason: string;
  /** True when the student added this course themselves (no AI reason). */
  added: boolean;
  /** True while the reason for this course is still being written. */
  reasonPending: boolean;
  /** True when this course is in the student's selected top five. */
  selected: boolean;
  /** True when the top five is full and this card is not one of them. */
  selectionDisabled: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}

/**
 * One course within a tier column: name and university, the one-line reason (or
 * an "added by you" tag), the entry requirement for self-check, and the UCAS
 * code and typical offer. Laid out vertically to sit in a narrow column. Every
 * fact comes straight from the course data — nothing here is invented. The reach
 * label is kept per card so a course's standing reads even within the Ambitious
 * column, which mixes a stretch with a long shot.
 */
export function CourseCard({
  candidate,
  reason,
  added,
  reasonPending,
  selected,
  selectionDisabled,
  onToggleSelect,
  onRemove,
}: CourseCardProps) {
  const { course, reachLevel } = candidate;
  const requirement = formatRequirement(course.requiredSubjects);
  // We show a reach standing and a typical offer only when we hold a confirmed
  // offer (reachLevel is computed). Without one, reach is pending and the tariff
  // is shown as a rough signal. Provenance no longer decides this: a verified
  // offer on a catalogue-sourced DB course reads as a real reach.
  const reachUnknown = reachLevel === "unknown";

  return (
    <article
      className={`flex flex-col border-t py-6 ${
        selected ? "border-primary" : "border-border"
      }`}
    >
      <div className="mb-2 text-[13px] font-medium text-primary">
        {reachUnknown ? "reach pending" : REACH_LABEL[reachLevel]}
      </div>
      <h3 className="text-[24px] font-medium leading-[1.12] tracking-[-0.02em] text-foreground">
        {course.name}
      </h3>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {course.degree} · {course.university}
      </p>

      {added ? (
        <p className="mt-3 text-[15px] italic text-muted-foreground">Added by you.</p>
      ) : reason ? (
        <p className="mt-3 text-[16px] leading-[1.5] text-foreground">{reason}</p>
      ) : reasonPending ? (
        <p className="mt-3 text-[15px] italic text-muted-foreground/70">
          Considering the fit…
        </p>
      ) : null}

      {reachUnknown ? (
        <div className="mt-4 text-[14px] text-muted-foreground">
          <span>Offer not yet verified — reach unavailable.</span>
          {typeof course.typicalTariff === "number" ? (
            <span>
              {" "}
              Typical entry tariff around {course.typicalTariff} points — a rough
              guide, not the offer.
            </span>
          ) : null}
          {course.ucasCode ? (
            <span className="mt-1 block">{course.ucasCode}</span>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 text-[14px] text-muted-foreground">
          <span className="text-foreground">{course.typicalOffer}</span>
          {course.ucasCode ? ` · ${course.ucasCode}` : " · code to confirm"}
        </div>
      )}
      {requirement ? (
        <div className="mt-1 text-[14px] text-muted-foreground">{requirement}</div>
      ) : null}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSelect}
          disabled={selectionDisabled}
          aria-pressed={selected}
          title={
            selectionDisabled ? "Your five are full — deselect one first" : undefined
          }
          className={`rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-150 ${
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-foreground enabled:hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {selected ? "Selected" : "Select"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-[14px] text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-primary hover:decoration-primary"
        >
          Remove
        </button>
      </div>
    </article>
  );
}
