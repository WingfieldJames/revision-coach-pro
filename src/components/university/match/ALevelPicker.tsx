import { GRADES, MAX_A_LEVELS, MIN_A_LEVELS } from "@/lib/uni/constants";
import type { ALevel, Grade } from "@/lib/uni/types";
import { SubjectCombobox } from "./SubjectCombobox";

interface ALevelPickerProps {
  aLevels: ALevel[];
  onChange: (slot: number, next: ALevel) => void;
  onAdd: () => void;
  onRemove: (slot: number) => void;
}

/** Three to five rows, one per A-level: a subject selector plus an A*–E grade
 * row. Choosing "Other" reveals a text input for the subject name. */
export function ALevelPicker({
  aLevels,
  onChange,
  onAdd,
  onRemove,
}: ALevelPickerProps) {
  const canRemove = aLevels.length > MIN_A_LEVELS;
  const canAdd = aLevels.length < MAX_A_LEVELS;

  return (
    <div className="flex flex-col gap-6">
      {aLevels.map((aLevel, slot) => (
        <div
          key={slot}
          className="flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-start min-[560px]:gap-4"
        >
          <div className="min-[560px]:w-[240px]">
            <SubjectCombobox
              ariaLabel={`A-level subject ${slot + 1}`}
              subject={aLevel.subject}
              otherSubject={aLevel.otherSubject}
              onSelect={(subject, otherSubject) =>
                onChange(slot, { ...aLevel, subject, otherSubject })
              }
            />
          </div>

          <div
            role="radiogroup"
            aria-label={`Grade for A-level ${slot + 1}`}
            className="flex flex-wrap gap-2.5 min-[560px]:pt-0"
          >
            {GRADES.map((grade) => {
              const isSelected = aLevel.grade === grade;
              return (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    onChange(slot, { ...aLevel, grade: grade as Grade })
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-medium transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:-translate-y-px hover:border-primary"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>

          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(slot)}
              aria-label={`Remove A-level ${slot + 1}`}
              className="self-start text-[14px] text-muted-foreground transition-colors duration-150 hover:text-primary min-[560px]:pt-3"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="self-start rounded-full border border-border px-[18px] py-2.5 text-[15px] font-medium text-foreground transition-all duration-150 hover:-translate-y-px hover:border-primary"
        >
          + Add another subject
        </button>
      )}
    </div>
  );
}
