import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SelectedCourse {
  courseId: string;
  name: string;
  university: string;
}

interface SelectionBarProps {
  selected: SelectedCourse[];
  max: number;
}

/**
 * Sticky bottom bar summarising the student's chosen courses: a live count
 * (n of max), the chosen universities, and the forward action to the personal
 * statement stage. The forward CTA is disabled until at least one course is
 * selected — selecting is what carries courses forward.
 */
export function SelectionBar({ selected, max }: SelectionBarProps) {
  const count = selected.length;
  const hasSelection = count > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-4 min-[860px]:flex-row min-[860px]:items-center min-[860px]:justify-between min-[860px]:px-8">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-primary">
            Your shortlist · {count} of {max}
          </p>
          <p className="mt-0.5 truncate text-[14px] text-muted-foreground">
            {hasSelection
              ? selected.map((c) => c.university).join(" · ")
              : "Select up to five courses to carry forward."}
          </p>
        </div>

        {hasSelection ? (
          <Button asChild variant="brand" className="shrink-0 rounded-full px-7">
            <Link to="/university/prepare">
              Write your statement for these →
            </Link>
          </Button>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary px-7 text-center text-sm font-semibold text-primary-foreground opacity-40"
          >
            Write your statement for these →
          </span>
        )}
      </div>
    </div>
  );
}
