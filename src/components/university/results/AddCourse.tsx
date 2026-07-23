import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  type CatalogueSummary,
  catalogueToCourse,
} from "@/lib/uni/catalogue";
import { searchCourses } from "@/lib/uni/search";
import type { Course } from "@/lib/uni/types";

interface AddCourseProps {
  /** Ids already on the list — excluded from the results. */
  existingIds: string[];
  onAdd: (course: Course) => void;
}

const MAX_RESULTS = 6;
const DEBOUNCE_MS = 250;

/**
 * Search and add a course from the live Discover Uni catalogue via
 * searchCourses. Added courses are honest about having no offer data yet —
 * see CourseCard.
 */
export function AddCourse({ existingIds, onAdd }: AddCourseProps) {
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<CatalogueSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const existing = useMemo(() => new Set(existingIds), [existingIds]);
  const q = query.trim().toLowerCase();

  // Debounced catalogue search.
  useEffect(() => {
    if (q.length < 2) {
      setCatalogue([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchCourses(q)
        .then((results) => {
          if (active) setCatalogue(results);
        })
        .catch(() => {
          if (active) setCatalogue([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const out: Course[] = [];
    const seen = new Set<string>();
    for (const r of catalogue) {
      if (existing.has(r.id) || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(catalogueToCourse(r));
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [q, catalogue, existing]);

  function handleAdd(course: Course) {
    onAdd(course);
    setQuery("");
    setCatalogue([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="add-course"
        className="text-[20px] font-medium tracking-[-0.01em] text-foreground"
      >
        Add a course you already want
      </label>
      <Input
        id="add-course"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by course or university"
        className="h-auto max-w-[520px] rounded-full px-5 py-3 text-[17px] transition-colors duration-150 placeholder:text-muted-foreground/60 focus-visible:border-ring md:text-[17px]"
      />

      {q.length >= 2 && results.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">
          {loading ? "Searching…" : "No courses match that."}
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="flex max-w-[520px] flex-col">
          {results.map((course) => (
            <li key={course.id}>
              <button
                type="button"
                onClick={() => handleAdd(course)}
                className="group flex w-full items-baseline justify-between gap-4 border-t border-border py-3 text-left transition-colors duration-150 hover:text-primary"
              >
                <span>
                  <span className="text-[17px] text-foreground group-hover:text-primary">
                    {course.name}
                  </span>{" "}
                  <span className="text-[15px] text-muted-foreground group-hover:text-primary">
                    {course.university}
                  </span>
                  {course.source === "catalogue" ? (
                    <span className="text-[13px] text-muted-foreground/70 group-hover:text-primary">
                      {" "}
                      · offer not held
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[14px] text-muted-foreground group-hover:text-primary">
                  add
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
