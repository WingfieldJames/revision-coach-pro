import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, X, RotateCcw, Brain, Zap, Shuffle, Clock, Moon, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── constants ─── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00–21:00 (represents 06:00–22:00 blocks)
const GRADES = ["U", "G", "F", "E", "D", "C", "B", "A", "A*"] as const;
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

/* Subject colours — purple gradient palette, accessible against white text */
const SUBJECT_COLORS = [
  { bg: "#1e3a8a", bgLight: "rgba(30,58,138,0.12)", border: "rgba(30,58,138,0.35)" },
  { bg: "#a855f7", bgLight: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)" },
  { bg: "#7c3aed", bgLight: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.35)" },
  { bg: "#4f36b3", bgLight: "rgba(79,54,179,0.12)", border: "rgba(79,54,179,0.35)" },
  { bg: "#6366f1", bgLight: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)" },
  { bg: "#8b5cf6", bgLight: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)" },
];

/* ─── storage keys ─── */
const SUBJECTS_KEY = "astar_timetable_subjects_v4";
const SLOTS_KEY = "astar_timetable_free_slots_v2";
const GENERATED_KEY = "astar_timetable_generated_v3";

/* ─── types ─── */
interface Subject {
  id: string;
  name: string;
  predicted: Grade;
  target: Grade;
  importance: number; // 0–100 slider
  subjectType: SubjectType;
  isCustom: boolean;
}

type SlotMap = Record<string, boolean>;
interface ScheduledSlot {
  subject: string;
  technique: string;
}
type GeneratedMap = Record<string, ScheduledSlot>;

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

function energyTier(hour: number): "high" | "medium" | "low" {
  if (hour >= 6 && hour <= 9) return "high";
  if (hour >= 10 && hour <= 13) return "medium";
  return "low";
}

/* ─── defaults ─── */
const defaultSubjects = (): Subject[] => [
  { id: "1", name: "", predicted: "C", target: "A", importance: 50, subjectType: "STEM - Conceptual", isCustom: false },
  { id: "2", name: "", predicted: "C", target: "A", importance: 50, subjectType: "Essay-Based / Humanities", isCustom: false },
  { id: "3", name: "", predicted: "C", target: "A", importance: 50, subjectType: "STEM - Conceptual", isCustom: false },
];

function defaultSlots(): SlotMap {
  const slots: SlotMap = {};
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
    for (let h = 6; h <= 13; h++) {
      slots[slotKey(day, h)] = true;
    }
  }
  return slots;
}

/* ─── SESSION TYPES per spec ─── */
const SESSION_SEQUENCE = ["Review Notes", "Active Recall", "Practice Questions", "Past Paper"];
const SESSION_CYCLE = ["Active Recall", "Spaced Review", "Practice Questions"];

function getSessionType(weekIndex: number, isLowEnergy: boolean): string {
  if (isLowEnergy) return weekIndex === 0 ? "Review Notes" : "Spaced Review";
  if (weekIndex < SESSION_SEQUENCE.length) return SESSION_SEQUENCE[weekIndex];
  const cycleIdx = (weekIndex - SESSION_SEQUENCE.length) % SESSION_CYCLE.length;
  return SESSION_CYCLE[cycleIdx];
}

/* ─── SCHEDULING ALGORITHM (per spec) ─── */
function generateTimetable(subjects: Subject[], freeSlots: SlotMap): GeneratedMap {
  const filled = subjects.filter(s => s.name.trim());
  const freeKeys = Object.keys(freeSlots).filter(k => freeSlots[k]);
  const totalHours = freeKeys.length;

  // Step 1: Calculate subject weights
  const weighted = filled.map(s => {
    const gap = gradeIndex(s.target) - gradeIndex(s.predicted);
    const baseWeight = Math.max(gap, 1);
    const priorityMultiplier = 0.5 + (s.importance / 100);
    return { subject: s, weight: baseWeight * priorityMultiplier, gap };
  });

  const totalWeight = weighted.reduce((a, w) => a + w.weight, 0);

  // Allocate hours proportionally
  const allocation = weighted.map(w => ({
    ...w,
    hours: Math.max(1, Math.round((w.weight / totalWeight) * totalHours)),
  }));

  // Fix rounding: give remainder to highest-weight
  let diff = totalHours - allocation.reduce((a, x) => a + x.hours, 0);
  allocation.sort((a, b) => b.weight - a.weight);
  let fixIdx = 0;
  while (diff !== 0 && fixIdx < 100) {
    const target = fixIdx % allocation.length;
    if (diff > 0) { allocation[target].hours++; diff--; }
    else if (allocation[target].hours > 1) { allocation[target].hours--; diff++; }
    fixIdx++;
  }

  // Step 2 & 3: Parse slots and classify by energy
  const parsedSlots = freeKeys.map(key => {
    const [day, hourStr] = key.split("-");
    const hour = parseInt(hourStr, 10);
    return { key, day, hour, dayIdx: DAYS.indexOf(day), energy: energyTier(hour) };
  });

  // Sort: high energy first, then medium, then low
  const energyOrder = { high: 0, medium: 1, low: 2 };
  parsedSlots.sort((a, b) => {
    if (energyOrder[a.energy] !== energyOrder[b.energy]) return energyOrder[a.energy] - energyOrder[b.energy];
    return a.dayIdx !== b.dayIdx ? a.dayIdx - b.dayIdx : a.hour - b.hour;
  });

  // Step 4: Sort subjects by difficulty (grade gap desc) for priority
  const sortedAlloc = [...allocation].sort((a, b) => b.gap - a.gap);

  // Build a round-robin pool
  const pool: { name: string; remaining: number; gap: number }[] = sortedAlloc.map(a => ({
    name: a.subject.name,
    remaining: a.hours,
    gap: a.gap,
  }));

  const result: GeneratedMap = {};
  const subjectWeekCount: Record<string, number> = {};
  const subjectDaySlots: Record<string, Set<string>> = {};

  // Round-robin allocation with interleaving
  let slotIdx = 0;
  let poolIdx = 0;
  let consecutiveCount = 0;
  let lastSubject = "";

  while (slotIdx < parsedSlots.length && pool.some(p => p.remaining > 0)) {
    const slot = parsedSlots[slotIdx];

    // Find next subject with remaining hours (round-robin)
    let attempts = 0;
    while (attempts < pool.length) {
      const candidate = pool[poolIdx % pool.length];
      if (candidate.remaining > 0) {
        // Interleaving check: no 3+ consecutive
        if (candidate.name === lastSubject && consecutiveCount >= 2) {
          // Try next subject
          poolIdx++;
          attempts++;
          continue;
        }

        // Spaced repetition: prefer distributing across different days
        if (!subjectDaySlots[candidate.name]) subjectDaySlots[candidate.name] = new Set();
        
        const isLowEnergy = slot.energy === "low";
        const weekIdx = subjectWeekCount[candidate.name] || 0;

        result[slot.key] = {
          subject: candidate.name,
          technique: getSessionType(weekIdx, isLowEnergy),
        };

        subjectWeekCount[candidate.name] = weekIdx + 1;
        subjectDaySlots[candidate.name].add(slot.day);
        candidate.remaining--;

        if (candidate.name === lastSubject) {
          consecutiveCount++;
        } else {
          consecutiveCount = 1;
          lastSubject = candidate.name;
        }

        poolIdx++;
        break;
      }
      poolIdx++;
      attempts++;
    }
    slotIdx++;
  }

  // Fill any remaining unassigned slots
  for (const slot of parsedSlots) {
    if (!result[slot.key]) {
      const topSubject = sortedAlloc[0];
      const weekIdx = subjectWeekCount[topSubject.subject.name] || 0;
      result[slot.key] = {
        subject: topSubject.subject.name,
        technique: getSessionType(weekIdx, slot.energy === "low"),
      };
      subjectWeekCount[topSubject.subject.name] = weekIdx + 1;
    }
  }

  return result;
}

/* ──────────────────────────────────────────────
   SubjectCard with autocomplete
   ────────────────────────────────────────────── */
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? KNOWN_SUBJECTS.filter(k => k.name.toLowerCase().includes(query.toLowerCase()))
    : [];
  const showCustomOption = query.trim().length > 0 && !KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === query.toLowerCase());

  const selectKnown = (known: { name: string; type: SubjectType }) => {
    setQuery(known.name);
    onUpdate({ name: known.name, subjectType: known.type, isCustom: false });
    setShowDropdown(false);
  };
  const selectCustom = () => {
    onUpdate({ name: query.trim(), isCustom: true });
    setShowDropdown(false);
  };
  const handleInput = (val: string) => {
    setQuery(val);
    setShowDropdown(true);
    if (!KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === val.toLowerCase())) {
      onUpdate({ name: val, isCustom: true });
    }
  };

  const priorityLabel = subject.importance < 33 ? "Low" : subject.importance < 66 ? "Medium" : "High";

  // Show warning if predicted >= target
  const gap = gradeIndex(subject.target) - gradeIndex(subject.predicted);
  const atOrAbove = subject.name.trim() && gap <= 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 relative shadow-sm">
      {canRemove && (
        <button onClick={onRemove} className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Autocomplete input */}
      <div ref={wrapperRef} className="relative mb-3">
        <Input
          placeholder={`Subject ${index + 1}`}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (query.trim()) setShowDropdown(true); }}
          className="text-sm font-medium"
          disabled={disabled}
        />
        {showDropdown && (filtered.length > 0 || showCustomOption) && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
            {filtered.slice(0, 8).map((k) => (
              <button
                key={k.name}
                onClick={() => selectKnown(k)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
              >
                <span>{k.name}</span>
                <span className="text-[10px] text-muted-foreground">{k.type.split(" - ")[0]}</span>
              </button>
            ))}
            {showCustomOption && (
              <>
                {filtered.length > 0 && <div className="border-t border-border" />}
                <button onClick={selectCustom} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors text-primary">
                  + Add &quot;{query.trim()}&quot; as custom subject
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Subject type: only for custom */}
      {subject.isCustom && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1 block">Subject Type</label>
          <select
            value={subject.subjectType}
            onChange={(e) => onUpdate({ subjectType: e.target.value as SubjectType })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
            disabled={disabled}
          >
            {SUBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
      {!subject.isCustom && subject.name.trim() && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
            {subject.subjectType}
          </span>
        </div>
      )}

      {/* Grades */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Predicted</label>
          <select
            value={subject.predicted}
            onChange={(e) => onUpdate({ predicted: e.target.value as Grade })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={disabled}
          >{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Target</label>
          <select
            value={subject.target}
            onChange={(e) => onUpdate({ target: e.target.value as Grade })}
            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={disabled}
          >{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
        </div>
      </div>

      {/* At/above warning */}
      {atOrAbove && (
        <p className="text-[10px] text-amber-600 mb-2">
          You're already at or above your target! We'll still allocate maintenance review time.
        </p>
      )}

      {/* Priority slider 0-100 */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Priority: <span className="font-semibold text-foreground">{priorityLabel}</span>
        </label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[subject.importance]}
          onValueChange={([v]) => onUpdate({ importance: v })}
          disabled={disabled}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */
export const RevisionTimetable: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadJSON(SUBJECTS_KEY, defaultSubjects()));
  const [freeSlots, setFreeSlots] = useState<SlotMap>(() => loadJSON(SLOTS_KEY, defaultSlots()));
  const [generated, setGenerated] = useState<GeneratedMap | null>(() => loadJSON(GENERATED_KEY, null));
  const [isGenerating, setIsGenerating] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem(SLOTS_KEY, JSON.stringify(freeSlots)), [freeSlots]);
  useEffect(() => localStorage.setItem(GENERATED_KEY, JSON.stringify(generated)), [generated]);

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const addSubject = () => {
    if (subjects.length >= 6) return;
    setSubjects(prev => [...prev, { id: crypto.randomUUID(), name: "", predicted: "C", target: "A", importance: 50, subjectType: "STEM - Conceptual", isCustom: false }]);
  };

  const removeSubject = (id: string) => setSubjects(prev => prev.filter(s => s.id !== id));

  const toggleSlot = useCallback((day: string, hour: number) => {
    if (generated) return;
    const key = slotKey(day, hour);
    setFreeSlots(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  }, [generated]);

  const toggleDay = (day: string) => {
    if (generated) return;
    const allSelected = HOURS.every(h => freeSlots[slotKey(day, h)]);
    setFreeSlots(prev => {
      const next = { ...prev };
      HOURS.forEach(h => {
        if (allSelected) delete next[slotKey(day, h)];
        else next[slotKey(day, h)] = true;
      });
      return next;
    });
  };

  const generate = () => {
    const filled = subjects.filter(s => s.name.trim());
    if (filled.length === 0) {
      toast({ title: "Add at least one subject", description: "Enter a subject name to continue.", variant: "destructive" });
      return;
    }
    const freeKeys = Object.keys(freeSlots).filter(k => freeSlots[k]);
    if (freeKeys.length === 0) {
      toast({ title: "No free periods selected", description: "Click on time blocks to mark your available hours.", variant: "destructive" });
      return;
    }
    if (freeKeys.length < filled.length) {
      toast({ title: "Very limited time", description: "With limited hours, we'll focus on your highest-priority subjects.", variant: "default" });
    }

    setIsGenerating(true);
    setTimeout(() => {
      const result = generateTimetable(filled, freeSlots);
      setGenerated(result);
      setIsGenerating(false);
      setTimeout(() => {
        timetableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 1500);
  };

  const reset = () => {
    setGenerated(null);
    localStorage.removeItem(GENERATED_KEY);
  };

  const downloadPDF = async () => {
    if (!generated) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Build subject breakdown
      const bk = Object.values(generated).reduce<Record<string, { hours: number; techniques: Set<string> }>>((acc, s) => {
        if (!acc[s.subject]) acc[s.subject] = { hours: 0, techniques: new Set() };
        acc[s.subject].hours++;
        acc[s.subject].techniques.add(s.technique);
        return acc;
      }, {});
      const totalHrs = Object.values(bk).reduce((a, b) => a + b.hours, 0);

      // Build colour map for PDF
      const pdfColorMap: Record<string, string> = {};
      subjects.filter(s => s.name.trim()).forEach((s, i) => {
        pdfColorMap[s.name] = SUBJECT_COLORS[i % SUBJECT_COLORS.length].bg;
      });

      // Build timetable grid HTML
      const daysRow = DAYS.map(d => `<th style="padding:6px 4px;text-align:center;font-size:11px;font-weight:600;border:1px solid #e5e7eb;background:#f9fafb;">${d}</th>`).join('');
      let gridRows = '';
      for (const h of HOURS) {
        const timeLabel = `${String(h).padStart(2, '0')}:00`;
        let cells = '';
        for (const d of DAYS) {
          const key = `${d}-${h}`;
          const slot = generated[key];
          if (slot) {
            const color = pdfColorMap[slot.subject] || '#7C3AED';
            cells += `<td style="padding:4px;border:1px solid #e5e7eb;background:${color};color:#fff;font-size:9px;text-align:center;"><strong>${slot.subject}</strong><br/><span style="opacity:0.85;font-size:8px;">${slot.technique}</span></td>`;
          } else {
            cells += `<td style="padding:4px;border:1px solid #e5e7eb;background:#f9fafb;font-size:9px;text-align:center;color:#9ca3af;">—</td>`;
          }
        }
        gridRows += `<tr><td style="padding:4px 6px;font-size:10px;font-weight:500;border:1px solid #e5e7eb;background:#f9fafb;white-space:nowrap;">${timeLabel}</td>${cells}</tr>`;
      }

      // Build subject overview rows
      const overviewRows = Object.entries(bk).map(([subj, data]) => {
        const color = pdfColorMap[subj] || '#7C3AED';
        const pct = totalHrs > 0 ? Math.round((data.hours / totalHrs) * 100) : 0;
        return `<tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${color};margin-right:6px;vertical-align:middle;"></span>${subj}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;text-align:center;">${data.hours}h</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;text-align:center;">${pct}%</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;">${[...data.techniques].join(', ')}</td>
        </tr>`;
      }).join('');

      const pdfHTML = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;padding:8px;">
          <div style="text-align:center;margin-bottom:20px;">
            <h1 style="font-size:22px;font-weight:700;margin:0 0 4px 0;">📅 Your Revision Timetable</h1>
            <p style="font-size:11px;color:#6b7280;margin:0;">Generated by A* AI · ${totalHrs} hours/week across ${Object.keys(bk).length} subjects</p>
          </div>

          <h2 style="font-size:14px;font-weight:600;margin:16px 0 8px 0;border-bottom:2px solid #7C3AED;padding-bottom:4px;">📊 Subject Overview</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead><tr style="background:#f3f4f6;">
              <th style="padding:6px 10px;text-align:left;font-size:11px;border:1px solid #e5e7eb;">Subject</th>
              <th style="padding:6px 10px;text-align:center;font-size:11px;border:1px solid #e5e7eb;">Hours</th>
              <th style="padding:6px 10px;text-align:center;font-size:11px;border:1px solid #e5e7eb;">%</th>
              <th style="padding:6px 10px;text-align:left;font-size:11px;border:1px solid #e5e7eb;">Techniques</th>
            </tr></thead>
            <tbody>${overviewRows}</tbody>
          </table>

          <h2 style="font-size:14px;font-weight:600;margin:16px 0 8px 0;border-bottom:2px solid #7C3AED;padding-bottom:4px;">🗓️ Weekly Schedule</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead><tr><th style="padding:6px 4px;font-size:10px;border:1px solid #e5e7eb;background:#f9fafb;">Time</th>${daysRow}</tr></thead>
            <tbody>${gridRows}</tbody>
          </table>

          <div style="page-break-before:always;"></div>
          <h2 style="font-size:14px;font-weight:600;margin:16px 0 8px 0;border-bottom:2px solid #7C3AED;padding-bottom:4px;">💡 Effective Revision Tips</h2>
          <div style="font-size:11px;line-height:1.7;">
            <p style="margin:0 0 8px;"><strong>🧠 Active Recall</strong> — Test yourself instead of re-reading notes. Cover your notes and try to write down everything you remember, then check. This is proven to be 2-3x more effective than passive reading.</p>
            <p style="margin:0 0 8px;"><strong>🔄 Spaced Repetition</strong> — Review material at increasing intervals (1 day, 3 days, 1 week, 2 weeks). This exploits the spacing effect and dramatically improves long-term retention.</p>
            <p style="margin:0 0 8px;"><strong>🔀 Interleaving</strong> — Mix different topics and subjects in each study session rather than blocking one topic for hours. Your timetable already does this! It forces your brain to discriminate between concepts.</p>
            <p style="margin:0 0 8px;"><strong>📝 Past Papers</strong> — The single best way to prepare for exams. Do papers under timed conditions, then mark them carefully. Focus on understanding mark schemes and examiner expectations.</p>
            <p style="margin:0 0 8px;"><strong>⏱️ Pomodoro Technique</strong> — Work in focused 25-minute blocks with 5-minute breaks. After 4 blocks, take a longer 15-30 minute break. This maintains concentration and prevents burnout.</p>
            <p style="margin:0 0 8px;"><strong>😴 Sleep & Exercise</strong> — Aim for 8+ hours of sleep. Your brain consolidates memories during sleep. Regular exercise boosts cognitive function and reduces exam anxiety.</p>
            <p style="margin:0 0 8px;"><strong>🎯 Weak Spot Focus</strong> — Spend more time on topics you find hardest, not the ones you already know. Your timetable weights subjects based on the gap between your predicted and target grades.</p>
          </div>

          <div style="text-align:center;margin-top:24px;border-top:2px solid #E9D5FF;padding-top:12px;font-size:10px;color:#9ca3af;">
            Generated by A* AI · astarai.co.uk
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:297mm;background:#ffffff;z-index:-1;';
      container.innerHTML = pdfHTML;
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: 'revision-timetable.pdf',
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(container.firstElementChild)
        .save();

      document.body.removeChild(container);
      toast({ title: "PDF downloaded!", description: "Your revision timetable has been saved." });
    } catch {
      toast({ title: "PDF download failed", description: "Please try again.", variant: "destructive" });
    }
  };

  /* ─── colour map ─── */
  const subjectColorMap: Record<string, (typeof SUBJECT_COLORS)[0]> = {};
  subjects.filter(s => s.name.trim()).forEach((s, i) => {
    subjectColorMap[s.name] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
  });

  const freeKeys = Object.keys(freeSlots).filter(k => freeSlots[k]);
  const totalFreeHours = freeKeys.length;
  const filledCount = subjects.filter(s => s.name.trim()).length;
  const canGenerate = filledCount > 0 && totalFreeHours > 0 && !isGenerating;

  /* ─── breakdown stats ─── */
  const breakdown = generated
    ? Object.values(generated).reduce<Record<string, { hours: number; techniques: Set<string> }>>((acc, s) => {
        if (!acc[s.subject]) acc[s.subject] = { hours: 0, techniques: new Set() };
        acc[s.subject].hours++;
        acc[s.subject].techniques.add(s.technique);
        return acc;
      }, {})
    : {};
  const totalGeneratedHours = Object.values(breakdown).reduce((a, b) => a + b.hours, 0);

  return (
    <div className="mb-12">
      {/* Science-Backed Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 mb-8"
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Science-Backed Scheduling</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Zap className="h-3 w-3" />, label: "Energy-optimised slots" },
                { icon: <Shuffle className="h-3 w-3" />, label: "Interleaved practice" },
                { icon: <Clock className="h-3 w-3" />, label: "Spaced repetition" },
                { icon: <Brain className="h-3 w-3" />, label: "Cognitive load matching" },
              ].map(p => (
                <span key={p.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {p.icon} {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subject cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
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

        {subjects.length < 6 && !generated && (
          <div className="flex justify-center mb-8">
            <Button variant="outline" size="sm" onClick={addSubject} className="flex items-center gap-1.5 text-sm">
              <Plus className="h-4 w-4" /> Add Subject (max 6)
            </Button>
          </div>
        )}
      </motion.div>

      {/* Hours counter */}
      {!generated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-3"
        >
          <p className="text-sm text-muted-foreground">
            {totalFreeHours > 0
              ? <><span className="font-semibold text-primary">{totalFreeHours} hours</span> selected — click cells to toggle, click day headers to select/clear entire days</>
              : "Click on time blocks below to mark your free study periods"
            }
          </p>
        </motion.div>
      )}

      {/* Availability grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-card border border-border rounded-2xl p-3 sm:p-4 mb-6 overflow-x-auto shadow-sm"
      >
        <div className="min-w-[560px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1 mb-1">
            <div />
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1.5 text-center"
                disabled={!!generated}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Time rows */}
          {HOURS.map(h => {
            const tier = energyTier(h);
            const isEvening = h >= 20;
            const isMorning = h >= 6 && h <= 9;

            return (
              <div key={h} className="grid grid-cols-[56px_repeat(7,1fr)] gap-1 mb-1">
                <div className="flex items-center justify-end pr-2 gap-1 text-xs text-muted-foreground tabular-nums">
                  {isMorning && <Zap className="h-3 w-3 text-amber-500" />}
                  {isEvening && <Moon className="h-3 w-3 text-indigo-400" />}
                  <span>{String(h).padStart(2, "0")}:00</span>
                </div>
                {DAYS.map(d => {
                  const key = slotKey(d, h);
                  const isFree = !!freeSlots[key];
                  const assigned = generated?.[key];
                  const color = assigned ? subjectColorMap[assigned.subject] : null;

                  return (
                    <button
                      key={key}
                      onClick={() => toggleSlot(d, h)}
                      className={`h-11 rounded-lg text-[9px] font-medium leading-tight transition-all duration-150 px-1 flex flex-col items-center justify-center ${
                        assigned
                          ? "text-white shadow-sm"
                          : isFree
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-muted/50 border border-transparent hover:border-border hover:bg-muted"
                      }`}
                      style={assigned && color ? { backgroundColor: color.bg } : undefined}
                      title={assigned ? `${assigned.subject}: ${assigned.technique}` : undefined}
                      disabled={!!generated}
                    >
                      {assigned ? (
                        <>
                          <span className="truncate w-full text-center font-bold text-[9px]">{assigned.subject}</span>
                          <span className="truncate w-full text-center opacity-80 text-[7px]">{assigned.technique}</span>
                        </>
                      ) : ""}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Generate button */}
      {!generated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mb-8"
        >
          <Button
            onClick={generate}
            disabled={!canGenerate}
            className="px-8 py-6 text-base font-semibold rounded-xl shadow-lg w-full max-w-[600px]"
            style={{ background: canGenerate ? "var(--gradient-brand)" : undefined }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Optimising your schedule...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Generate My Timetable
              </span>
            )}
          </Button>
        </motion.div>
      )}

      {/* Generated output */}
      <AnimatePresence>
        {generated && (
          <motion.div
            ref={timetableRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs mb-4">
              {Object.entries(subjectColorMap).map(([name, color]) => (
                <span key={name} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: color.bg }} />
                  <span className="font-medium">{name}</span>
                </span>
              ))}
            </div>

            {/* Breakdown summary */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
              {/* Stacked bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-4">
                {Object.entries(breakdown).map(([name, data]) => (
                  <div
                    key={name}
                    className="h-full transition-all"
                    style={{
                      width: `${(data.hours / totalGeneratedHours) * 100}%`,
                      backgroundColor: subjectColorMap[name]?.bg || "#888",
                    }}
                    title={`${name}: ${data.hours}h`}
                  />
                ))}
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(breakdown).map(([name, data]) => {
                  const pct = Math.round((data.hours / totalGeneratedHours) * 100);
                  const color = subjectColorMap[name];
                  return (
                    <div
                      key={name}
                      className="rounded-xl p-3 border"
                      style={{ backgroundColor: color?.bgLight, borderColor: color?.border }}
                    >
                      <p className="font-semibold text-sm text-foreground mb-1">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{data.hours}h/week</span> · {pct}% of total
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Sessions: {Array.from(data.techniques).join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" /> Reset & Re-generate
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPDF} className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> Download as PDF
              </Button>
            </div>

            {/* Science explainer accordion */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-sm text-foreground mb-3">How does this work?</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="spaced">
                  <AccordionTrigger className="text-sm">Spaced Repetition</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    We schedule review sessions at increasing intervals — you'll revisit weaker subjects more frequently to lock in long-term memory. Research shows that spacing out practice over time leads to significantly better retention than massed study.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="interleaved">
                  <AccordionTrigger className="text-sm">Interleaved Practice</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Instead of marathon sessions on one subject, we mix topics throughout the day. Research shows this improves retention and problem-solving ability compared to blocked practice, even though it may feel harder in the moment.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="recall">
                  <AccordionTrigger className="text-sm">Active Recall</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Each session includes a retrieval practice component — testing yourself is proven to be 2–3× more effective than re-reading notes. We assign "Active Recall" and "Practice Questions" sessions to maximise this effect.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cognitive">
                  <AccordionTrigger className="text-sm">Cognitive Load Matching</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    We place your hardest subjects during peak energy hours (mornings) and lighter review in the evenings. This aligns with research on circadian rhythms and cognitive performance, ensuring you tackle demanding material when your brain is at its sharpest.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
