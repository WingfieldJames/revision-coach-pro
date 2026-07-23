import { useState } from "react";
import { SUBJECT_GROUPS } from "@/lib/uni/constants";
import { Textarea } from "@/components/ui/textarea";
import { PillGroup } from "./PillGroup";

interface SubjectPickerProps {
  selected: string[];
  onToggle: (id: string) => void;
  customSubject: string;
  onCustomChange: (value: string) => void;
}

/**
 * The course-type picker: collapsible groups of pills (one PillGroup per group),
 * then an "Or" divider introducing an always-visible free-text field where a
 * student can describe a combination not captured by the pills.
 */
export function SubjectPicker({
  selected,
  onToggle,
  customSubject,
  onCustomChange,
}: SubjectPickerProps) {
  // Every group starts collapsed; the student opens whichever they want.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-8">
      {SUBJECT_GROUPS.map((group) => {
        const isOpen = open[group.name] ?? false;
        return (
          <div key={group.name} className="flex flex-col gap-3.5">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((prev) => ({ ...prev, [group.name]: !isOpen }))
              }
              className="group flex items-center gap-2 self-start text-[14px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className={`transition-transform duration-150 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                <path
                  d="M4 2.5 L8 6 L4 9.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {group.name}
            </button>
            {isOpen && (
              <PillGroup
                options={group.subjects}
                selected={selected}
                onToggle={onToggle}
              />
            )}
          </div>
        );
      })}

      <div className="flex flex-col border-t border-border pt-8">
        <div className="text-[36px] font-medium leading-none tracking-[-0.02em] text-foreground">
          Or
        </div>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Describe what you would study?
        </p>
        <Textarea
          value={customSubject}
          onChange={(e) => onCustomChange(e.target.value)}
          rows={4}
          placeholder="Describe the course or combination you're after, in as much detail as you like — e.g. economics with a modern language, or a joint maths and philosophy degree."
          aria-label="Describe what you would study"
          className="mt-4 max-w-[640px] resize-none rounded-2xl px-5 py-4 text-[17px] transition-colors duration-150 placeholder:text-muted-foreground/60 focus-visible:border-ring"
        />
      </div>
    </div>
  );
}
