import { useEffect, useId, useRef, useState } from "react";
import {
  SELECTABLE_SUBJECTS,
  filterSubjects,
  subjectLabel,
  type Subject,
} from "@/lib/uni/subjects";

interface SubjectComboboxProps {
  subject: string;
  otherSubject?: string;
  ariaLabel: string;
  onSelect: (subject: string, otherSubject?: string) => void;
}

/**
 * Type-to-filter subject picker. Replaces the native <select>: the student types
 * and matching A-level subjects are recommended; typing a subject not in the list
 * commits it as a custom ("other") subject inline.
 */
export function SubjectCombobox({
  subject,
  otherSubject,
  ariaLabel,
  onSelect,
}: SubjectComboboxProps) {
  const committed = subjectLabel(subject, otherSubject);
  const [query, setQuery] = useState(committed);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Re-sync the field to the committed value whenever it changes from outside
  // (e.g. restored inputs) and the box isn't being actively edited.
  useEffect(() => {
    if (!open) setQuery(committed);
  }, [committed, open]);

  // Close on an outside click, reverting the text to the committed value.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(committed);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, committed]);

  const matches = filterSubjects(query);
  const trimmed = query.trim();
  const hasExact = SELECTABLE_SUBJECTS.some(
    (s) => s.label.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCustom = trimmed !== "" && !hasExact;
  const rowCount = matches.length + (showCustom ? 1 : 0);

  function commitSubject(s: Subject) {
    onSelect(s.id);
    setQuery(s.label);
    setOpen(false);
  }

  function commitCustom() {
    onSelect("other", trimmed);
    setQuery(trimmed);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (rowCount > 0) setHighlight((h) => (h + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && rowCount > 0) {
        setHighlight((h) => (h - 1 + rowCount) % rowCount);
      }
    } else if (e.key === "Enter") {
      if (open && rowCount > 0) {
        e.preventDefault();
        if (highlight < matches.length) commitSubject(matches[highlight]);
        else if (showCustom) commitCustom();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(committed);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && rowCount > 0 ? `${listId}-${highlight}` : undefined
        }
        aria-label={ariaLabel}
        value={query}
        placeholder="Choose subject"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-full border border-input bg-background px-5 text-[15px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-ring"
      />
      {open && rowCount > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {matches.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={highlight === i}
              onMouseDown={(e) => {
                e.preventDefault();
                commitSubject(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-5 py-2.5 text-[15px] text-popover-foreground ${
                highlight === i ? "bg-muted" : ""
              }`}
            >
              {s.label}
            </li>
          ))}
          {showCustom && (
            <li
              id={`${listId}-${matches.length}`}
              role="option"
              aria-selected={highlight === matches.length}
              onMouseDown={(e) => {
                e.preventDefault();
                commitCustom();
              }}
              onMouseEnter={() => setHighlight(matches.length)}
              className={`flex cursor-pointer items-baseline gap-2 px-5 py-2.5 text-[15px] text-popover-foreground ${
                highlight === matches.length ? "bg-muted" : ""
              }`}
            >
              <span>Use “{trimmed}”</span>
              <span className="text-[13px] text-muted-foreground">
                add as your subject
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
