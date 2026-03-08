import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Plus, X, RotateCcw, CalendarDays, Brain, Zap, Shuffle, Clock } from "lucide-react";
import { motion } from "framer-motion";

/* ─── constants ─── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const GRADES = ["U", "E", "D", "C", "B", "A", "A*"] as const;
type Grade = (typeof GRADES)[number];

const SUBJECT_TYPES = [
  "STEM - Heavy Calculation",
  "STEM - Conceptual",
  "Essay-Based / Humanities",
  "Language / Memory-Heavy",
] as const;
type SubjectType = (typeof SUBJECT_TYPES)[number];

/* ─── default subject catalogue ─── */
const KNOWN_SUBJECTS: { name: string; type: SubjectType }[] = [
  { name: "Mathematics", type: "STEM - Heavy Calculation" },
  { name: "Further Mathematics", type: "STEM - Heavy Calculation" },
  { name: "Physics", type: "STEM - Heavy Calculation" },
  { name: "Chemistry", type: "STEM - Heavy Calculation" },
  { name: "Accounting", type: "STEM - Heavy Calculation" },
  { name: "Statistics", type: "STEM - Heavy Calculation" },
  { name: "Biology", type: "STEM - Conceptual" },
  { name: "Computer Science", type: "STEM - Conceptual" },
  { name: "Electronics", type: "STEM - Conceptual" },
  { name: "Environmental Science", type: "STEM - Conceptual" },
  { name: "Psychology", type: "STEM - Conceptual" },
  { name: "Geography", type: "STEM - Conceptual" },
  { name: "Economics", type: "STEM - Conceptual" },
  { name: "Business Studies", type: "STEM - Conceptual" },
  { name: "English Literature", type: "Essay-Based / Humanities" },
  { name: "English Language", type: "Essay-Based / Humanities" },
  { name: "History", type: "Essay-Based / Humanities" },
  { name: "Politics", type: "Essay-Based / Humanities" },
  { name: "Philosophy", type: "Essay-Based / Humanities" },
  { name: "Sociology", type: "Essay-Based / Humanities" },
  { name: "Religious Studies", type: "Essay-Based / Humanities" },
  { name: "Law", type: "Essay-Based / Humanities" },
  { name: "Media Studies", type: "Essay-Based / Humanities" },
  { name: "Art", type: "Essay-Based / Humanities" },
  { name: "Music", type: "Essay-Based / Humanities" },
  { name: "Drama", type: "Essay-Based / Humanities" },
  { name: "Film Studies", type: "Essay-Based / Humanities" },
  { name: "PE", type: "Essay-Based / Humanities" },
  { name: "Design & Technology", type: "Essay-Based / Humanities" },
  { name: "French", type: "Language / Memory-Heavy" },
  { name: "Spanish", type: "Language / Memory-Heavy" },
  { name: "German", type: "Language / Memory-Heavy" },
  { name: "Italian", type: "Language / Memory-Heavy" },
  { name: "Mandarin", type: "Language / Memory-Heavy" },
  { name: "Arabic", type: "Language / Memory-Heavy" },
  { name: "Latin", type: "Language / Memory-Heavy" },
  { name: "Greek", type: "Language / Memory-Heavy" },
  { name: "Japanese", type: "Language / Memory-Heavy" },
  { name: "Russian", type: "Language / Memory-Heavy" },
  { name: "Urdu", type: "Language / Memory-Heavy" },
];

const SUBJECT_COLORS = [
  { bg: "rgba(147,51,234,0.25)", border: "rgba(147,51,234,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(59,130,246,0.25)", border: "rgba(59,130,246,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(16,185,129,0.25)", border: "rgba(16,185,129,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(245,158,11,0.25)", border: "rgba(245,158,11,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(239,68,68,0.25)", border: "rgba(239,68,68,0.5)", text: "hsl(var(--foreground))" },
  { bg: "rgba(14,165,233,0.25)", border: "rgba(14,165,233,0.5)", text: "hsl(var(--foreground))" },
];

/* ─── storage keys ─── */
const SUBJECTS_KEY = "astar_timetable_subjects_v3";
const SLOTS_KEY = "astar_timetable_free_slots";
const GENERATED_KEY = "astar_timetable_generated_v2";

/* ─── types ─── */
interface Subject {
  id: string;
  name: string;
  predicted: Grade;
  target: Grade;
  importance: number;
  subjectType: SubjectType;
  isCustom: boolean;
}

type SlotMap = Record<string, boolean>;
interface ScheduledSlot {
  subject: string;
  technique: string;
}
type GeneratedMap = Record<string, ScheduledSlot>;

const defaultSubjects = (): Subject[] => [
  { id: "1", name: "", predicted: "C", target: "A", importance: 3, subjectType: "STEM - Conceptual", isCustom: false },
  { id: "2", name: "", predicted: "C", target: "A", importance: 3, subjectType: "Essay-Based / Humanities", isCustom: false },
  { id: "3", name: "", predicted: "C", target: "A", importance: 3, subjectType: "STEM - Conceptual", isCustom: false },
];

/* ─── scientific scheduling techniques ─── */
const TECHNIQUES_BY_TYPE: Record<SubjectType, string[]> = {
  "STEM - Heavy Calculation": ["Practice Problems", "Worked Examples", "Timed Drills", "Error Analysis"],
  "STEM - Conceptual": ["Active Recall", "Concept Mapping", "Feynman Technique", "Past Papers"],
  "Essay-Based / Humanities": ["Essay Plans", "Timed Essays", "Source Analysis", "Model Answer Review"],
  "Language / Memory-Heavy": ["Flashcard Drill", "Spaced Recall", "Active Writing", "Practice Translation"],
};

const COGNITIVE_LOAD: Record<SubjectType, number> = {
  "STEM - Heavy Calculation": 5,
  "STEM - Conceptual": 4,
  "Essay-Based / Humanities": 3,
  "Language / Memory-Heavy": 3,
};

function energyLevel(hour: number): number {
  if (hour >= 6 && hour <= 8) return 0.7;
  if (hour >= 9 && hour <= 11) return 1.0;
  if (hour === 12) return 0.6;
  if (hour >= 13 && hour <= 14) return 0.5;
  if (hour >= 15 && hour <= 17) return 0.85;
  if (hour >= 18 && hour <= 19) return 0.7;
  return 0.5;
}

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

function generateScientificTimetable(
  subjects: Subject[],
  freeSlots: SlotMap
): GeneratedMap {
  const filledSubjects = subjects.filter(s => s.name.trim());
  const freeKeys = Object.keys(freeSlots).filter(k => freeSlots[k]);

  // 1. Calculate weighted priority scores
  const priorities = filledSubjects.map(s => {
    const gap = gradeIndex(s.target) - gradeIndex(s.predicted);
    const urgency = Math.max(gap, 0);
    // Weight = (grade gap + 1) * importance * cognitive difficulty factor
    const cogFactor = COGNITIVE_LOAD[s.subjectType] / 3;
    return {
      subject: s,
      weight: (urgency + 1) * s.importance * cogFactor,
      cognitiveLoad: COGNITIVE_LOAD[s.subjectType],
      techniques: TECHNIQUES_BY_TYPE[s.subjectType],
    };
  });

  const totalWeight = priorities.reduce((a, p) => a + p.weight, 0);

  // 2. Calculate slot allocation per subject
  const totalSlotCount = freeKeys.length;
  const allocation = priorities.map(p => ({
    ...p,
    slots: Math.max(1, Math.round((p.weight / totalWeight) * totalSlotCount)),
  }));

  // Fix rounding
  let diff = totalSlotCount - allocation.reduce((a, x) => a + x.slots, 0);
  let idx = 0;
  while (diff !== 0) {
    allocation[idx % allocation.length].slots += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    idx++;
  }

  // 3. Parse and sort slots by day then hour
  const parsedSlots = freeKeys.map(key => {
    const parts = key.split("-");
    const day = parts[0];
    const hour = parseInt(parts[1], 10);
    return { key, day, hour, dayIdx: DAYS.indexOf(day) };
  }).sort((a, b) => a.dayIdx !== b.dayIdx ? a.dayIdx - b.dayIdx : a.hour - b.hour);

  // 4. Classify slots by energy suitability
  // High-energy slots get high-cognitive subjects, low-energy slots get lighter subjects
  const slotsWithEnergy = parsedSlots.map(s => ({
    ...s,
    energy: energyLevel(s.hour),
  }));

  // 5. Build subject pool with techniques (spaced repetition pattern)
  interface SubjectBlock {
    name: string;
    cognitiveLoad: number;
    technique: string;
    priority: number;
  }

  const subjectPool: SubjectBlock[] = [];
  for (const alloc of allocation) {
    const techniques = alloc.techniques;
    for (let i = 0; i < alloc.slots; i++) {
      // Cycle through techniques for variety (interleaving)
      const technique = techniques[i % techniques.length];
      subjectPool.push({
        name: alloc.subject.name,
        cognitiveLoad: alloc.cognitiveLoad,
        technique,
        priority: alloc.weight,
      });
    }
  }

  // 6. Assign subjects to slots using energy-matching algorithm
  // Sort pool by cognitive load descending
  subjectPool.sort((a, b) => b.cognitiveLoad - a.cognitiveLoad);

  // Sort slots by energy descending
  const slotsByEnergy = [...slotsWithEnergy].sort((a, b) => b.energy - a.energy);

  const result: GeneratedMap = {};
  const assignedSlots = new Set<string>();
  const assignedBlocks: SubjectBlock[] = [];

  // First pass: match high-cognitive subjects to high-energy slots
  for (const block of subjectPool) {
    // Find best available slot
    let bestSlot = null;
    let bestScore = -Infinity;

    for (const slot of slotsByEnergy) {
      if (assignedSlots.has(slot.key)) continue;

      // Score = energy match + anti-consecutive bonus + daily variety bonus
      let score = slot.energy * block.cognitiveLoad;

      // Anti-consecutive: penalize if same subject was in adjacent slot
      const prevKey = slotKey(slot.day, slot.hour - 1);
      const nextKey = slotKey(slot.day, slot.hour + 1);
      if (result[prevKey]?.subject === block.name) score -= 2;
      if (result[nextKey]?.subject === block.name) score -= 2;

      // Check for 3+ consecutive same subject (strong penalty)
      const prev2Key = slotKey(slot.day, slot.hour - 2);
      if (result[prevKey]?.subject === block.name && result[prev2Key]?.subject === block.name) {
        score -= 10; // heavily penalize 3+ consecutive
      }

      // Daily variety: bonus if this subject hasn't been seen much today
      const sameDayCount = Object.entries(result)
        .filter(([k, v]) => k.startsWith(slot.day + "-") && v.subject === block.name)
        .length;
      score -= sameDayCount * 0.5;

      // Spaced distribution: prefer even spread across days
      const totalDaysWithSubject = new Set(
        Object.entries(result)
          .filter(([, v]) => v.subject === block.name)
          .map(([k]) => k.split("-")[0])
      ).size;
      if (!Object.entries(result).some(([k, v]) => k.startsWith(slot.day + "-") && v.subject === block.name)) {
        score += 1.5; // bonus for spreading to new day
      }

      if (score > bestScore) {
        bestScore = score;
        bestSlot = slot;
      }
    }

    if (bestSlot) {
      result[bestSlot.key] = { subject: block.name, technique: block.technique };
      assignedSlots.add(bestSlot.key);
      assignedBlocks.push(block);
    }
  }

  // Fill any remaining unassigned free slots with the highest-priority subject
  for (const slot of parsedSlots) {
    if (!assignedSlots.has(slot.key)) {
      const topSubject = allocation[0];
      const technique = topSubject.techniques[Math.floor(Math.random() * topSubject.techniques.length)];
      result[slot.key] = { subject: topSubject.subject.name, technique };
    }
  }

  return result;
}

/* ─── SubjectCard with autocomplete ─── */
const SubjectCard: React.FC<{
  subject: Subject;
  index: number;
  disabled: boolean;
  canRemove: boolean;
  onUpdate: (patch: Partial<Subject>) => void;
  onRemove: () => void;
}> = ({ subject, index, disabled, canRemove, onUpdate, onRemove }) => {
  const [query, setQuery] = useState(subject.name);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? KNOWN_SUBJECTS.filter(k => k.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const showCustomOption = query.trim().length > 0 && !KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === query.toLowerCase());

  const selectKnownSubject = (known: { name: string; type: SubjectType }) => {
    setQuery(known.name);
    onUpdate({ name: known.name, subjectType: known.type, isCustom: false });
    setShowDropdown(false);
  };

  const selectCustom = () => {
    onUpdate({ name: query.trim(), isCustom: true });
    setShowDropdown(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setShowDropdown(true);
    // If they clear or change from a known subject, mark as needing re-selection
    if (!KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === val.toLowerCase())) {
      onUpdate({ name: val, isCustom: true });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 relative">
      {canRemove && (
        <button onClick={onRemove} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Subject autocomplete input */}
      <div ref={wrapperRef} className="relative mb-3">
        <Input
          placeholder={`Subject ${index + 1}`}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (query.trim()) setShowDropdown(true); }}
          className="text-sm"
          disabled={disabled}
        />
        {showDropdown && (filtered.length > 0 || showCustomOption) && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
            {filtered.slice(0, 8).map((k) => (
              <button
                key={k.name}
                onClick={() => selectKnownSubject(k)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
              >
                <span>{k.name}</span>
                <span className="text-[10px] text-muted-foreground">{k.type.split(" - ")[0]}</span>
              </button>
            ))}
            {showCustomOption && (
              <>
                {filtered.length > 0 && <div className="border-t border-border" />}
                <button
                  onClick={selectCustom}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors text-primary"
                >
                  + Add "<span className="font-medium">{query.trim()}</span>" as custom subject
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Subject Type - only show for custom subjects */}
      {subject.isCustom && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1 block">Subject Type</label>
          <select
            value={subject.subjectType}
            onChange={(e) => onUpdate({ subjectType: e.target.value as SubjectType })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
            disabled={disabled}
          >
            {SUBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Show matched type badge for known subjects */}
      {!subject.isCustom && subject.name.trim() && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
            {subject.subjectType}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Predicted</label>
          <select
            value={subject.predicted}
            onChange={(e) => onUpdate({ predicted: e.target.value as Grade })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={disabled}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target</label>
          <select
            value={subject.target}
            onChange={(e) => onUpdate({ target: e.target.value as Grade })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={disabled}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Priority: {["Low", "Medium-Low", "Medium", "High", "Critical"][subject.importance - 1]}</label>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[subject.importance]}
          onValueChange={([v]) => onUpdate({ importance: v })}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

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
    if (subjects.length >= 6) return;
    setSubjects((prev) => [...prev, { id: crypto.randomUUID(), name: "", predicted: "C", target: "A", importance: 3, subjectType: "STEM - Conceptual", isCustom: false }]);
  };

  const removeSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  /* ─── slot toggle ─── */
  const toggleSlot = useCallback(
    (day: string, hour: number) => {
      if (generated) return;
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

  /* ─── bulk slot selection ─── */
  const selectAllDay = (day: string) => {
    if (generated) return;
    setFreeSlots(prev => {
      const next = { ...prev };
      HOURS.forEach(h => { next[slotKey(day, h)] = true; });
      return next;
    });
  };

  const clearAllDay = (day: string) => {
    if (generated) return;
    setFreeSlots(prev => {
      const next = { ...prev };
      HOURS.forEach(h => { delete next[slotKey(day, h)]; });
      return next;
    });
  };

  /* ─── generate ─── */
  const generate = () => {
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

    const result = generateScientificTimetable(filledSubjects, freeSlots);
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

  // Stats
  const freeKeys = Object.keys(freeSlots).filter(k => freeSlots[k]);
  const totalFreeHours = freeKeys.length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">

      {/* Scientific methods info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Science-Backed Scheduling</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Energy-optimised slots</span>
              <span className="flex items-center gap-1"><Shuffle className="h-3 w-3 text-primary" /> Interleaved practice</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> Spaced repetition</span>
              <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary" /> Cognitive load matching</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {subjects.map((s, i) => (
          <SubjectCard
            key={s.id}
            subject={s}
            index={i}
            disabled={!!generated}
            canRemove={subjects.length > 1}
            onUpdate={(patch) => updateSubject(s.id, patch)}
            onRemove={() => removeSubject(s.id)}
          />
        ))}
      </div>

      {/* Add subject */}
      {subjects.length < 6 && !generated && (
        <div className="flex justify-center mb-6">
          <Button variant="outline" size="sm" onClick={addSubject} className="flex items-center gap-1.5 text-sm">
            <Plus className="h-4 w-4" /> Add Subject (max 6)
          </Button>
        </div>
      )}

      {/* Free hours counter */}
      {!generated && (
        <div className="text-center mb-3">
          <p className="text-sm text-muted-foreground">
            {totalFreeHours > 0 
              ? <><span className="font-semibold text-primary">{totalFreeHours}</span> hours selected — click cells to toggle, click day headers to select/clear entire days</>
              : "Click on time blocks below to mark your free study periods"
            }
          </p>
        </div>
      )}

      {/* Weekly grid */}
      <div className="bg-muted border border-border rounded-2xl p-3 sm:p-4 mb-4 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Day headers with select/clear buttons */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div /> {/* spacer for time column */}
            {DAYS.map((d) => (
              <div key={d} className="text-center">
                <button
                  onClick={() => {
                    const allSelected = HOURS.every(h => freeSlots[slotKey(d, h)]);
                    if (allSelected) clearAllDay(d); else selectAllDay(d);
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1 w-full"
                  disabled={!!generated}
                >
                  {d}
                </button>
              </div>
            ))}
          </div>

          {/* Energy indicator bar */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div className="flex items-center justify-end pr-2 text-[9px] text-muted-foreground/50">⚡</div>
            {DAYS.map(d => (
              <div key={d} className="h-1 rounded-full bg-muted" />
            ))}
          </div>

          {/* Time rows */}
          {HOURS.map((h) => {
            const energy = energyLevel(h);
            const energyColor = energy >= 0.85 ? 'bg-green-500/20' : energy >= 0.6 ? 'bg-yellow-500/15' : 'bg-orange-500/10';
            return (
              <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
                <div className={`flex items-center justify-end pr-2 text-xs text-muted-foreground tabular-nums rounded-l-md ${energyColor}`}>
                  {String(h).padStart(2, "0")}:00
                </div>
                {DAYS.map((d) => {
                  const key = slotKey(d, h);
                  const isFree = !!freeSlots[key];
                  const assigned = generated?.[key];
                  const color = assigned ? subjectColorMap[assigned.subject] : null;

                  return (
                    <button
                      key={key}
                      onClick={() => toggleSlot(d, h)}
                      className={`h-10 rounded-md text-[9px] font-medium leading-tight transition-all duration-150 px-1 flex flex-col items-center justify-center ${
                        assigned
                          ? "border"
                          : isFree
                          ? "border border-transparent"
                          : "bg-accent border border-transparent hover:border-border"
                      }`}
                      style={
                        assigned && color
                          ? { background: color.bg, borderColor: color.border, color: color.text }
                          : isFree
                          ? { background: "var(--gradient-brand)", color: "white" }
                          : undefined
                      }
                      title={assigned ? `${assigned.subject}: ${assigned.technique}` : undefined}
                      disabled={!!generated}
                    >
                      {assigned ? (
                        <>
                          <span className="truncate w-full text-center font-semibold text-[9px]">{assigned.subject}</span>
                          <span className="truncate w-full text-center opacity-70 text-[7px]">{assigned.technique}</span>
                        </>
                      ) : ""}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend (when generated) */}
      {generated && (
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {Object.entries(subjectColorMap).map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: color.bg, border: `1px solid ${color.border}` }} />
                {name}
              </span>
            ))}
          </div>

          {/* Energy legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500/40" /> Peak Focus (9-11am)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/40" /> Good Focus</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500/40" /> Light Study</span>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            {Object.entries(
              Object.values(generated).reduce<Record<string, number>>((acc, s) => {
                acc[s.subject] = (acc[s.subject] || 0) + 1;
                return acc;
              }, {})
            ).map(([name, count]) => (
              <span key={name}><span className="font-semibold text-foreground">{count}h</span> {name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {!generated ? (
          <Button variant="brand" size="lg" onClick={generate} className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Generate Smart Timetable
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" /> Reset & Re-generate
          </Button>
        )}
      </div>
    </motion.div>
  );
};
