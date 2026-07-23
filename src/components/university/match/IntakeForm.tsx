import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_A_LEVELS,
  MIN_A_LEVELS,
  PREFERENCE_QUESTIONS,
} from "@/lib/uni/constants";
import {
  emptyInputs,
  isComplete,
  loadInputs,
  saveInputs,
} from "@/lib/uni/intake";
import type { ALevel, MatchInputs } from "@/lib/uni/types";
import { SubjectPicker } from "./SubjectPicker";
import { ALevelPicker } from "./ALevelPicker";
import { PreferencePicker } from "./PreferencePicker";

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function IntakeForm() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<MatchInputs>(emptyInputs);

  // Restore any earlier selections so back-navigation keeps them. The shell
  // has already hydrated storage before this mounts, so a signed-in user's
  // server work is in place.
  useEffect(() => {
    const saved = loadInputs();
    if (saved) setInputs(saved);
  }, []);

  const ready = isComplete(inputs);

  function handleSubmit() {
    if (!ready) return;
    saveInputs(inputs);
    navigate("/university/results");
  }

  return (
    <div className="flex flex-col gap-16 pb-24 min-[860px]:gap-20">
      <Field
        index="01"
        title="What could you study?"
        hint="Pick the course types that interest you. Tick as many as you like."
      >
        <SubjectPicker
          selected={inputs.subjects}
          onToggle={(id) =>
            setInputs((p) => ({ ...p, subjects: toggle(p.subjects, id) }))
          }
          customSubject={inputs.customSubject}
          onCustomChange={(value) =>
            setInputs((p) => ({ ...p, customSubject: value }))
          }
        />
      </Field>

      <Field
        index="02"
        title="Your predicted A-level grades."
        hint="Pick each subject and the grade you're predicted. We use these to check entry requirements honestly."
      >
        <ALevelPicker
          aLevels={inputs.aLevels}
          onChange={(slot, next: ALevel) =>
            setInputs((p) => {
              const aLevels = [...p.aLevels];
              aLevels[slot] = next;
              return { ...p, aLevels };
            })
          }
          onAdd={() =>
            setInputs((p) =>
              p.aLevels.length >= MAX_A_LEVELS
                ? p
                : { ...p, aLevels: [...p.aLevels, { subject: "", grade: "" }] },
            )
          }
          onRemove={(slot) =>
            setInputs((p) =>
              p.aLevels.length <= MIN_A_LEVELS
                ? p
                : { ...p, aLevels: p.aLevels.filter((_, i) => i !== slot) },
            )
          }
        />
      </Field>

      {PREFERENCE_QUESTIONS.map((question) => (
        <Field
          key={question.id}
          index={question.index}
          title={question.title}
          hint={question.hint}
        >
          <PreferencePicker
            question={question}
            selected={inputs.preferences[question.id] ?? []}
            other={inputs.preferenceOther[question.id] ?? ""}
            onChange={(selected) =>
              setInputs((p) => ({
                ...p,
                preferences: { ...p.preferences, [question.id]: selected },
              }))
            }
            onOtherChange={(value) =>
              setInputs((p) => ({
                ...p,
                preferenceOther: { ...p.preferenceOther, [question.id]: value },
              }))
            }
          />
        </Field>
      ))}

      <Field index="09" title="Anything else we should know?">
        <Textarea
          value={inputs.freeText}
          onChange={(e) =>
            setInputs((p) => ({ ...p, freeText: e.target.value }))
          }
          rows={4}
          placeholder="Optional. Specific interests, accessibility needs, anything that matters to you."
          className="max-w-[640px] resize-none rounded-2xl px-5 py-4 text-[17px] transition-colors duration-150 placeholder:text-muted-foreground/60 focus-visible:border-ring"
        />
      </Field>

      <div className="flex flex-col items-start gap-3 border-t border-border pt-10">
        <Button
          type="button"
          variant="brand"
          size="xl"
          onClick={handleSubmit}
          disabled={!ready}
          className="rounded-full px-8"
        >
          See your matches →
        </Button>
        {!ready && (
          <p className="text-[14px] text-muted-foreground">
            Pick or type at least one course type, and a subject and grade for
            every A-level, to continue.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 min-[860px]:grid-cols-[1fr_2fr] min-[860px]:gap-16">
      <div>
        <div className="mb-3 text-[15px] font-medium text-primary">
          {index}
        </div>
        <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        {hint && (
          <p className="mt-2 max-w-[320px] text-[15px] text-muted-foreground">{hint}</p>
        )}
      </div>
      <div className="min-[860px]:pt-1">{children}</div>
    </section>
  );
}
