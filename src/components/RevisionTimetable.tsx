import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Plus, X, RotateCcw, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

/* ─── constants ─── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21 → represents 06:00-22:00
const GRADES = ["D", "C", "B", "A", "A*"] as const;
type Grade = (typeof GRADES)[number];

const SUBJECT_COLORS = [
  { bg: "rgba(147,51,234,0.25)", border: "rgba(147,51,234,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(59,130,246,0.25)", border: "rgba(59,130,246,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(16,185,129,0.25)", border: "rgba(16,185,129,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(245,158,11,0.25)", border: "rgba(245,158,11,0.5)", text: "hsl(var(--foreground))" },
];

/* ─── storage keys ─── */
const SUBJECTS_KEY = "astar_timetable_subjects";
const SLOTS_KEY = "astar_timetable_free_slots";
const GENERATED_KEY = "astar_timetable_generated";

/* ─── types ─── */
interface Subject {
  id: string;
  name: string;
  predicted: Grade;
  target: Grade;
  importance: number;
}

type SlotMap = Record<string, boolean>;
type GeneratedMap = Record<string, string>; // slot key → subject name

/* ─── helpers ─── */
const gradeIndex = (g: Grade) => GRADES.indexOf(g);
const slotKey = (day: string, hour: number) => `${day}-${hour}`;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const defaultSubjects = (): Subject[] => [
  { id: "1", name: "", predicted: "C", target: "A", importance: 3 },
  { id: "2", name: "", predicted: "C", target: "A", importance: 3 },
  { id: "3", name: "", predicted: "C", target: "A", importance: 3 },
];

/* ─── component ─── */
export const RevisionTimetable: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadJSON(SUBJECTS_KEY, defaultSubjects()));
  const [freeSlots, setFreeSlots] = useState<SlotMap>(() => loadJSON(SLOTS_KEY, {}));
  const [generated, setGenerated] = useState<GeneratedMap | null>(() => loadJSON(GENERATED_KEY, null));

  // persist
  useEffect(() => localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem(SLOTS_KEY, JSON.stringify(freeSlots)), [freeSlots]);
  useEffect(() => localStorage.setItem(GENERATED_KEY, JSON.stringify(generated)), [generated]);

  /* ─── subject handlers ─── */
  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSubject = () => {
    if (subjects.length >= 4) return;
    setSubjects((prev) => [...prev, { id: crypto.randomUUID(), name: "", predicted: "C", target: "A", importance: 3 }]);
  };

  const removeSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  /* ─── slot toggle ─── */
  const toggleSlot = useCallback(
    (day: string, hour: number) => {
      if (generated) return; // locked while generated
      const key = slotKey(day, hour);
      setFreeSlots((prev) => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = true;
        return next;
      });
    },
    [generated]
  );

  /* ─── generate ─── */
  const generate = () => {
    // validation
    const filledSubjects = subjects.filter((s) => s.name.trim());
    if (filledSubjects.length === 0) {
      toast({ title: "Add at least one subject", description: "Enter a subject name to continue.", variant: "destructive" });
      return;
    }
    for (const s of filledSubjects) {
      if (gradeIndex(s.target) < gradeIndex(s.predicted)) {
        toast({ title: `Target grade for ${s.name} is below predicted`, description: "Target must be ≥ predicted grade.", variant: "destructive" });
        return;
      }
    }
    const freeKeys = Object.keys(freeSlots).filter((k) => freeSlots[k]);
    if (freeKeys.length === 0) {
      toast({ title: "No free periods selected", description: "Click on time blocks to mark your free periods.", variant: "destructive" });
      return;
    }

    // weights
    const weights = filledSubjects.map((s) => {
      const gap = gradeIndex(s.target) - gradeIndex(s.predicted);
      return { name: s.name, weight: (gap + 1) * s.importance };
    });
    const totalWeight = weights.reduce((a, w) => a + w.weight, 0);

    // allocate hours per subject
    const totalSlots = freeKeys.length;
    const allocation: { name: string; slots: number }[] = weights.map((w) => ({
      name: w.name,
      slots: Math.round((w.weight / totalWeight) * totalSlots),
    }));

    // fix rounding
    let diff = totalSlots - allocation.reduce((a, x) => a + x.slots, 0);
    let idx = 0;
    while (diff !== 0) {
      allocation[idx % allocation.length].slots += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
      idx++;
    }

    // round-robin fill
    const sortedKeys = [...freeKeys].sort((a, b) => {
      const [ad, ah] = a.split("-");
      const [bd, bh] = b.split("-");
      const di = DAYS.indexOf(ad) - DAYS.indexOf(bd);
      return di !== 0 ? di : Number(ah) - Number(bh);
    });

    // build pool: repeat subject names according to slots count
    const pool: string[] = [];
    for (const a of allocation) for (let i = 0; i < a.slots; i++) pool.push(a.name);

    // interleave: distribute round-robin
    const buckets: string[][] = allocation.map(() => []);
    let pi = 0;
    for (const a of allocation) {
      for (let i = 0; i < a.slots; i++) buckets[pi].push(a.name);
      pi++;
    }

    const interleaved: string[] = [];
    const maxLen = Math.max(...buckets.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        if (i < bucket.length) interleaved.push(bucket[i]);
      }
    }

    const result: GeneratedMap = {};
    sortedKeys.forEach((key, i) => {
      result[key] = interleaved[i] || interleaved[interleaved.length - 1];
    });

    setGenerated(result);
  };

  const reset = () => {
    setGenerated(null);
    localStorage.removeItem(GENERATED_KEY);
  };

  /* ─── get subject color ─── */
  const subjectColorMap: Record<string, (typeof SUBJECT_COLORS)[0]> = {};
  subjects.filter((s) => s.name.trim()).forEach((s, i) => {
    subjectColorMap[s.name] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revision Timetable</h2>
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {subjects.map((s, i) => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-4 relative">
            {/* Remove button for 4th+ */}
            {subjects.length > 3 && i >= 3 && (
              <button onClick={() => removeSubject(s.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <Input
              placeholder={`Subject ${i + 1}`}
              value={s.name}
              onChange={(e) => updateSubject(s.id, { name: e.target.value })}
              className="mb-3 text-sm"
              disabled={!!generated}
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Predicted</label>
                <select
                  value={s.predicted}
                  onChange={(e) => updateSubject(s.id, { predicted: e.target.value as Grade })}
                  className="w-full h-9 rounded-md border border-input px-2 text-sm text-foreground"
                  style={{ backgroundColor: "#ffffff" }}
                  disabled={!!generated}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Target</label>
                <select
                  value={s.target}
                  onChange={(e) => updateSubject(s.id, { target: e.target.value as Grade })}
                  className="w-full h-9 rounded-md border border-input px-2 text-sm text-foreground"
                  style={{ backgroundColor: "#ffffff" }}
                  disabled={!!generated}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Importance: {s.importance}</label>
              {/* Override --primary locally so the slider's bg-primary / border-primary resolve to #a855f7 */}
              <div style={{ '--primary': '271 91% 65%', '--ring': '271 91% 65%' } as React.CSSProperties}>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[s.importance]}
                  onValueChange={([v]) => updateSubject(s.id, { importance: v })}
                  disabled={!!generated}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add subject */}
      {subjects.length < 4 && !generated && (
        <div className="flex justify-center mb-6">
          <Button variant="outline" size="sm" onClick={addSubject} className="flex items-center gap-1.5 text-sm">
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>
      )}

      {/* Weekly grid */}
      <div className="bg-muted border border-border rounded-2xl p-3 sm:p-4 mb-4 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div /> {/* spacer for time column */}
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Time rows */}
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
              <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground tabular-nums">
                {String(h).padStart(2, "0")}:00
              </div>
              {DAYS.map((d) => {
                const key = slotKey(d, h);
                const isFree = !!freeSlots[key];
                const assignedSubject = generated?.[key];
                const color = assignedSubject ? subjectColorMap[assignedSubject] : null;

                return (
                  <button
                    key={key}
                    onClick={() => toggleSlot(d, h)}
                    className={`h-8 rounded-md text-[10px] font-medium leading-tight transition-all duration-150 truncate px-1 ${
                      assignedSubject
                        ? "border"
                        : isFree
                        ? "border border-transparent"
                        : "bg-accent border border-transparent hover:border-border"
                    }`}
                    style={
                      assignedSubject && color
                        ? { background: color.bg, borderColor: color.border, color: color.text }
                        : isFree
                        ? { background: "var(--gradient-brand)", color: "white" }
                        : undefined
                    }
                    disabled={!!generated}
                  >
                    {assignedSubject || ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend (when generated) */}
      {generated && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-xs">
          {Object.entries(subjectColorMap).map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded" style={{ background: color.bg, border: `1px solid ${color.border}` }} />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {!generated ? (
          <Button variant="brand" size="lg" onClick={generate}>
            Generate Timetable
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" /> Reset Timetable
          </Button>
        )}
      </div>
    </motion.div>
  );
};
