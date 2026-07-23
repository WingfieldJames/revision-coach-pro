import type { PreferenceQuestion } from "@/lib/uni/constants";
import { Input } from "@/components/ui/input";
import { PillGroup } from "./PillGroup";

interface PreferencePickerProps {
  question: PreferenceQuestion;
  selected: string[];
  other: string;
  onChange: (selected: string[]) => void;
  onOtherChange: (value: string) => void;
}

/**
 * One structured preference question: a PillGroup honouring the question's
 * single/multi mode and optional cap, plus a text input when "Other" is picked.
 */
export function PreferencePicker({
  question,
  selected,
  other,
  onChange,
  onOtherChange,
}: PreferencePickerProps) {
  function toggle(id: string) {
    const has = selected.includes(id);
    let next: string[];

    if (question.mode === "single") {
      next = has ? [] : [id];
    } else if (has) {
      next = selected.filter((x) => x !== id);
    } else {
      if (question.max && selected.length >= question.max) return;
      next = [...selected, id];
    }

    // Drop any typed "Other" text once that pill is no longer selected.
    if (!next.includes("other") && other) onOtherChange("");
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <PillGroup
        options={question.options}
        selected={selected}
        onToggle={toggle}
      />
      {selected.includes("other") && (
        <Input
          type="text"
          value={other}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Type your answer"
          aria-label={`Other answer for ${question.title}`}
          className="h-11 max-w-[380px] rounded-full px-5 text-[15px] transition-colors duration-150 placeholder:text-muted-foreground/60 focus-visible:border-ring md:text-[15px]"
        />
      )}
    </div>
  );
}
