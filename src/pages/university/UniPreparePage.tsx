import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveCourse } from "@/lib/uni/catalogue";
import { SUBJECTS } from "@/lib/uni/constants";
import { loadInputs } from "@/lib/uni/intake";
import { loadFinalList } from "@/lib/uni/results";
import {
  ACTIVITY_TYPES,
  activityLabel,
  loadPool,
  needsReflection,
  savePool,
  type ActivityCard,
} from "@/lib/uni/prepare";

/** The student's chosen courses, shown as read-only context while they capture. */
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

/** The first chosen subject's friendly label, or a generic fallback. */
function useSubjectLabel() {
  return useMemo(() => {
    const first = loadInputs()?.subjects[0];
    if (!first) return "your subject";
    return SUBJECTS.find((s) => s.id === first)?.label ?? "your subject";
  }, []);
}

const inputClass =
  "mt-1.5 h-auto w-full rounded-xl px-4 py-3 text-[17px] leading-[1.55] transition-colors duration-150 placeholder:text-muted-foreground/60 focus-visible:border-ring md:text-[17px]";
const labelClass = "block text-[14px] text-muted-foreground";
const hairline = "border-border/60";
const revealDelays = ["reveal-delay-1", "reveal-delay-2", "reveal-delay-3"];

interface AddModalProps {
  initialType: string;
  subjectLabel: string;
  onSave: (card: ActivityCard) => void;
  onClose: () => void;
}

/** Full-screen capture popup: pick a category, then fill in the fields. */
function AddActivityModal({
  initialType,
  subjectLabel,
  onSave,
  onClose,
}: AddModalProps) {
  const [type, setType] = useState(initialType);
  const [did, setDid] = useState("");
  const [reflection, setReflection] = useState("");
  const [subjectLink, setSubjectLink] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [onClose]);

  const canAdd = type !== "" && did.trim() !== "";
  const flag = did.trim() !== "" && reflection.trim() === "";

  function add() {
    if (!canAdd) return;
    onSave({ id: crypto.randomUUID(), type, did, reflection, subjectLink });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add something you've done"
      onClick={onClose}
      className="fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 min-[860px]:items-center min-[860px]:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-[1040px] rounded-[14px] border border-border bg-card p-7 text-card-foreground shadow-elevated min-[860px]:p-10"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[clamp(28px,4vw,40px)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
            Add something you&apos;ve done
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 shrink-0 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-10">
          <span className={labelClass}>What kind of thing is it?</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((t) => {
              const selected = t.id === type;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-full border px-3.5 py-2 text-[14px] font-medium transition-colors duration-150 ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-5">
          <label className="block">
            <span className={labelClass}>What did you do?</span>
            <Input
              type="text"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="read Why Nations Fail, chapters 3–7"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>
              What did you take from it, or what did it make you think?
            </span>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder="it made me question whether institutions or geography matter more"
              className={`${inputClass} resize-y`}
            />
            {flag ? (
              <span className="mt-2 block text-[14px] font-medium text-destructive">
                needs a reflection
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className={labelClass}>
              How does it connect to {subjectLabel}?
            </span>
            <Input
              type="text"
              value={subjectLink}
              onChange={(e) => setSubjectLink(e.target.value)}
              placeholder="leave blank if it doesn't really"
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-10 flex items-center gap-5">
          <Button
            type="button"
            variant="brand"
            onClick={add}
            disabled={!canAdd}
            className="rounded-full px-7"
          >
            Add to your material
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface ItemProps {
  card: ActivityCard;
  editing: boolean;
  subjectLabel: string;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<ActivityCard>) => void;
  onRemove: () => void;
  first: boolean;
}

/** One activity inside a category box: compact two-line display, or inline fields. */
function ActivityItem({
  card,
  editing,
  subjectLabel,
  onEdit,
  onDone,
  onChange,
  onRemove,
  first,
}: ItemProps) {
  const flag = needsReflection(card);
  const removeClass =
    "shrink-0 text-[13px] text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-primary hover:decoration-primary";

  return (
    <li
      className={`py-4 ${first ? "" : `border-t ${hairline}`} ${
        flag ? "border-l-[3px] border-l-destructive pl-3" : ""
      }`}
    >
      {editing ? (
        <div>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className={labelClass}>What did you do?</span>
              <Input
                type="text"
                value={card.did}
                onChange={(e) => onChange({ did: e.target.value })}
                placeholder="read Why Nations Fail, chapters 3–7"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                What did you take from it, or what did it make you think?
              </span>
              <Textarea
                value={card.reflection}
                onChange={(e) => onChange({ reflection: e.target.value })}
                rows={4}
                placeholder="it made me question whether institutions or geography matter more"
                className={`${inputClass} resize-y`}
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                How does it connect to {subjectLabel}?
              </span>
              <Input
                type="text"
                value={card.subjectLink}
                onChange={(e) => onChange({ subjectLink: e.target.value })}
                placeholder="leave blank if it doesn't really"
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={onDone}
              className="text-[14px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Done
            </button>
            <button type="button" onClick={onRemove} className={removeClass}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block text-[17px] leading-snug text-foreground">
              {card.did || "untitled — add a detail"}
            </span>
            {card.reflection ? (
              <span className="mt-1 block text-[15px] leading-snug text-muted-foreground">
                {card.reflection}
              </span>
            ) : null}
          </button>
          <button type="button" onClick={onRemove} className={removeClass}>
            Remove
          </button>
        </div>
      )}

      {flag ? (
        <p className="mt-2 text-[14px] font-medium text-destructive">
          needs a reflection
        </p>
      ) : null}
    </li>
  );
}

export const UniPreparePage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [cards, setCards] = useState<ActivityCard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("");
  const chosen = useChosenCourses();
  const subjectLabel = useSubjectLabel();

  // Read the pool on mount — the shell has already settled storage (server
  // work pulled in for the signed-in user) before this view renders.
  useEffect(() => {
    setCards(loadPool());
    setMounted(true);
  }, []);

  function updateCard(id: string, patch: Partial<ActivityCard>) {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      savePool(next);
      return next;
    });
  }

  function openAdd(type = "") {
    setAddType(type);
    setAddOpen(true);
  }

  function commitCard(card: ActivityCard) {
    setCards((prev) => {
      const next = [...prev, card];
      savePool(next);
      return next;
    });
  }

  function removeCard(id: string) {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      savePool(next);
      return next;
    });
    setEditingId((cur) => (cur === id ? null : cur));
  }

  function shape() {
    savePool(cards);
    navigate("/university/organise");
  }

  if (!mounted) return null;

  const count = cards.length;
  const thin = count < 4;

  // Group items by type, keeping the canonical category order.
  const byType = new Map<string, ActivityCard[]>();
  for (const c of cards) {
    const list = byType.get(c.type);
    if (list) list.push(c);
    else byType.set(c.type, [c]);
  }
  const populated = ACTIVITY_TYPES.filter((t) => byType.has(t.id));
  const empty = ACTIVITY_TYPES.filter((t) => !byType.has(t.id));
  // Defensive: items with an unrecognised type (e.g. legacy data) never go missing.
  const knownIds = new Set<string>(ACTIVITY_TYPES.map((t) => t.id));
  const orphanTypes = Array.from(byType.keys()).filter((t) => !knownIds.has(t));

  // A render function (not a nested component) so the input subtree keeps its
  // identity across re-renders — rendering <Foo/> from a closure would remount
  // and steal focus from the field being typed in.
  const renderBox = (type: string, label: string, revealDelay: string) => {
    const items = byType.get(type) ?? [];
    return (
      <section
        key={type}
        className={`reveal-up ${revealDelay} rounded-lg border border-border bg-card p-5 text-card-foreground shadow-card min-[860px]:p-6`}
      >
        <header className="flex items-center justify-between gap-3">
          <h3 className="text-[22px] font-medium leading-tight text-foreground">
            {label}
            <span className="ml-1.5 text-[15px] font-normal text-muted-foreground">
              · {items.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => openAdd(type)}
            aria-label={`Add to ${label}`}
            className="shrink-0 text-[22px] leading-none text-foreground transition-colors duration-150 hover:text-primary"
          >
            +
          </button>
        </header>
        <ul className="mt-3 flex flex-col">
          {items.map((item, i) => (
            <ActivityItem
              key={item.id}
              card={item}
              editing={editingId === item.id}
              subjectLabel={subjectLabel}
              first={i === 0}
              onEdit={() => setEditingId(item.id)}
              onDone={() => setEditingId(null)}
              onChange={(patch) => updateCard(item.id, patch)}
              onRemove={() => removeCard(item.id)}
            />
          ))}
        </ul>
      </section>
    );
  };

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
      <div className="flex flex-col gap-16 pb-24">
        <div className="reveal-up reveal-delay-1 max-w-[640px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Your material.
          </h1>
          <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
            Everything you&apos;ve done that might belong in your statement. Get
            it all down first — you&apos;ll shape it into answers next.
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

        <div className="flex flex-col gap-6">
          <div className="reveal-up reveal-delay-1 flex items-center">
            <span aria-hidden="true" className="block h-px w-10 bg-primary" />
            <h2 className="ml-[14px] text-[15px] font-medium text-primary">
              Your material · {count} item{count === 1 ? "" : "s"}
            </h2>
          </div>

          <div className="reveal-up reveal-delay-1">
            <Button
              type="button"
              variant="brand"
              onClick={() => openAdd("")}
              className="rounded-full px-[22px]"
            >
              Add something you&apos;ve done
            </Button>
          </div>

          {populated.length > 0 || orphanTypes.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-4 min-[860px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {populated.map((t, i) =>
                renderBox(t.id, t.label, revealDelays[i % 3]),
              )}
              {orphanTypes.map((t, i) =>
                renderBox(
                  t,
                  activityLabel(t),
                  revealDelays[(populated.length + i) % 3],
                ),
              )}
            </div>
          ) : null}

          {empty.length > 0 && count === 0 ? (
            // Starting state: large, distinct category boxes that fill the space
            // and invite the first add. The whole box is the add affordance.
            <div className="grid grid-cols-1 gap-4 min-[860px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {empty.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openAdd(t.id)}
                  className={`group reveal-up ${revealDelays[i % 3]} flex min-h-[240px] flex-col justify-between rounded-lg border border-border bg-card p-8 text-left transition-colors duration-150 hover:border-primary`}
                >
                  <span className="text-[24px] font-medium leading-tight text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                    {t.label}
                  </span>
                  <span className="text-[15px] text-muted-foreground transition-colors duration-150 group-hover:text-primary">
                    add +
                  </span>
                </button>
              ))}
            </div>
          ) : empty.length > 0 ? (
            // Supplementary gap prompt once material exists: tighter tiles.
            <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {empty.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                >
                  <span className="text-[18px] font-medium text-muted-foreground">
                    {t.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAdd(t.id)}
                    className="shrink-0 text-[14px] text-muted-foreground transition-colors duration-150 hover:text-primary"
                  >
                    add +
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="reveal-up reveal-delay-3 flex flex-col gap-3 border-t border-border pt-6 min-[860px]:flex-row min-[860px]:items-center min-[860px]:justify-between">
          <p className="max-w-[560px] text-[15px] text-muted-foreground">
            {thin
              ? "Most strong statements draw on more than this — add a few more before you shape them."
              : "Take what you've gathered into the writing stage when you're ready."}
          </p>
          <Button
            type="button"
            variant="brand"
            onClick={shape}
            className="shrink-0 self-start rounded-full px-7 min-[860px]:self-auto"
          >
            Shape these into answers →
          </Button>
        </div>

        {addOpen ? (
          <AddActivityModal
            initialType={addType}
            subjectLabel={subjectLabel}
            onSave={commitCard}
            onClose={() => setAddOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
};
