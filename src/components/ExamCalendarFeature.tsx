import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, ChevronLeft, ChevronRight, CalendarDays, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExamEntry,
  getAvailableBoards,
  getSubjectsForBoard,
  getExamsForSelections,
} from '@/data/examTimetable2026';

interface SubjectSelection {
  board: string;
  subject: string;
}

interface CustomEvent {
  id: string;
  date: string;
  title: string;
  time: string;
}

const CUSTOM_EVENTS_KEY = 'astar_exam_calendar_events';
const SELECTIONS_KEY = 'astar_exam_calendar_selections';

function loadSelections(): SubjectSelection[] {
  try { return JSON.parse(localStorage.getItem(SELECTIONS_KEY) || '[]'); } catch { return []; }
}
function saveSelections(s: SubjectSelection[]) { localStorage.setItem(SELECTIONS_KEY, JSON.stringify(s)); }
function loadCustomEvents(): CustomEvent[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_EVENTS_KEY) || '[]'); } catch { return []; }
}
function saveCustomEvents(e: CustomEvent[]) { localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(e)); }

const MONTHS = [
  { year: 2026, month: 4, label: 'May 2026' },
  { year: 2026, month: 5, label: 'June 2026' },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

// Color palette for subjects
const SUBJECT_COLORS = [
  'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300',
  'bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300',
  'bg-pink-500/20 border-pink-500/40 text-pink-700 dark:text-pink-300',
  'bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300',
  'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300',
  'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300',
];

interface ExamCalendarFeatureProps {
  /** Pre-fill with current subject if in chatbot context */
  initialSubject?: string;
  initialBoard?: string;
  /** Compact mode for sidebar popup */
  compact?: boolean;
}

export const ExamCalendarFeature: React.FC<ExamCalendarFeatureProps> = ({
  initialSubject,
  initialBoard,
  compact = false,
}) => {
  const boards = useMemo(() => getAvailableBoards(), []);

  const [selections, setSelections] = useState<SubjectSelection[]>(() => {
    const saved = loadSelections();
    if (saved.length > 0) return saved;
    if (initialSubject && initialBoard) return [{ subject: initialSubject, board: initialBoard }];
    return [{ board: '', subject: '' }, { board: '', subject: '' }, { board: '', subject: '' }];
  });
  const [generated, setGenerated] = useState(() => loadSelections().length > 0);
  const [monthIndex, setMonthIndex] = useState(0);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(loadCustomEvents);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', time: '' });

  const validSelections = selections.filter(s => s.board && s.subject);

  const exams = useMemo(() => {
    if (!generated) return [];
    return getExamsForSelections(validSelections);
  }, [generated, validSelections]);

  const subjectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const uniqueSubjects = [...new Set(validSelections.map(s => `${s.board} ${s.subject}`))];
    uniqueSubjects.forEach((s, i) => { map[s] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]; });
    return map;
  }, [validSelections]);

  const handleUpdateSelection = (index: number, field: 'board' | 'subject', value: string) => {
    const next = [...selections];
    if (field === 'board') {
      next[index] = { board: value, subject: '' };
    } else {
      next[index] = { ...next[index], subject: value };
    }
    setSelections(next);
  };

  const handleAddSubject = () => {
    setSelections([...selections, { board: '', subject: '' }]);
  };

  const handleRemoveSubject = (i: number) => {
    if (selections.length <= 1) return;
    setSelections(selections.filter((_, idx) => idx !== i));
  };

  const handleGenerate = () => {
    saveSelections(validSelections);
    setGenerated(true);
  };

  const handleAddCustomEvent = () => {
    if (!newEvent.date || !newEvent.title) return;
    const next = [...customEvents, { ...newEvent, id: crypto.randomUUID() }];
    setCustomEvents(next);
    saveCustomEvents(next);
    setNewEvent({ date: '', title: '', time: '' });
    setShowAddEvent(false);
  };

  const handleDeleteCustomEvent = (id: string) => {
    const next = customEvents.filter(e => e.id !== id);
    setCustomEvents(next);
    saveCustomEvents(next);
  };

  const currentMonth = MONTHS[monthIndex];

  // Calendar rendering
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
    const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
    const cells: React.ReactNode[] = [];

    // Empty cells for offset
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] sm:min-h-[120px] border border-border/30 bg-muted/20 rounded-lg" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayExams = exams.filter(e => e.date === dateStr);
      const dayCustom = customEvents.filter(e => e.date === dateStr);
      const isToday = new Date().toISOString().slice(0, 10) === dateStr;
      const hasEvents = dayExams.length > 0 || dayCustom.length > 0;

      cells.push(
        <div
          key={day}
          className={`min-h-[100px] sm:min-h-[120px] border rounded-lg p-1.5 sm:p-2 flex flex-col transition-colors ${
            isToday ? 'border-primary bg-primary/5' : hasEvents ? 'border-border bg-card' : 'border-border/30 bg-card/50'
          }`}
        >
          <span className={`text-xs sm:text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {day}
          </span>
          <div className="flex-1 space-y-0.5 overflow-y-auto">
            {dayExams.map((exam, i) => {
              const colorClass = subjectColorMap[`${exam.board} ${exam.subject}`] || SUBJECT_COLORS[0];
              return (
                <div
                  key={i}
                  className={`text-[9px] sm:text-[10px] leading-tight px-1.5 py-1 rounded border ${colorClass}`}
                >
                  <div className="font-semibold truncate">{exam.paper}</div>
                  <div className="flex items-center gap-1 opacity-75">
                    <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    {exam.start_time === '09:00' ? 'AM' : 'PM'} • {exam.duration}
                  </div>
                </div>
              );
            })}
            {dayCustom.map(ev => (
              <div
                key={ev.id}
                className="text-[9px] sm:text-[10px] leading-tight px-1.5 py-1 rounded border bg-accent/30 border-accent text-accent-foreground group relative"
              >
                <div className="font-semibold truncate">{ev.title}</div>
                {ev.time && <div className="opacity-75">{ev.time}</div>}
                <button
                  onClick={() => handleDeleteCustomEvent(ev.id)}
                  className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Setup view
  if (!generated) {
    return (
      <div className={compact ? '' : 'max-w-3xl mx-auto'}>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Exam Calendar</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Select your subjects and boards to see your personalised exam timetable
            </p>
          </div>

          {selections.map((sel, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <select
                  value={sel.board}
                  onChange={e => handleUpdateSelection(i, 'board', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Board</option>
                  {boards.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select
                  value={sel.subject}
                  onChange={e => handleUpdateSelection(i, 'subject', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!sel.board}
                >
                  <option value="">Select Subject</option>
                  {sel.board && getSubjectsForBoard(sel.board).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {selections.length > 1 && (
                <button onClick={() => handleRemoveSubject(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleAddSubject} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Subject
            </Button>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={validSelections.length === 0}
            className="w-full"
            variant="brand"
          >
            Generate Calendar
          </Button>
        </div>
      </div>
    );
  }

  // Calendar view
  return (
    <div className={compact ? '' : 'w-full'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setGenerated(false); }}
            className="gap-1 text-xs"
          >
            Edit Subjects
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddEvent(true)}
            className="gap-1 text-xs"
          >
            <Plus className="h-3 w-3" /> Add Event
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))}
            disabled={monthIndex === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-bold text-foreground min-w-[140px] text-center">
            {currentMonth.label}
          </h3>
          <button
            onClick={() => setMonthIndex(Math.min(MONTHS.length - 1, monthIndex + 1))}
            disabled={monthIndex === MONTHS.length - 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Subject legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {validSelections.map((s, i) => {
          const key = `${s.board} ${s.subject}`;
          const colorClass = subjectColorMap[key] || SUBJECT_COLORS[0];
          return (
            <span key={i} className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border font-medium ${colorClass}`}>
              {s.board} {s.subject}
            </span>
          );
        })}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      {/* Upcoming exams summary */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          All Exams ({exams.length})
        </h4>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {exams.map((exam, i) => {
            const colorClass = subjectColorMap[`${exam.board} ${exam.subject}`] || SUBJECT_COLORS[0];
            const d = new Date(exam.date);
            return (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${colorClass}`}>
                <span className="font-mono text-xs shrink-0">
                  {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="font-semibold truncate flex-1">{exam.paper}</span>
                <span className="text-xs opacity-75 shrink-0">
                  {exam.start_time === '09:00' ? 'AM' : 'PM'} • {exam.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add event modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowAddEvent(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Add Custom Event</h3>
                <button onClick={() => setShowAddEvent(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  min="2026-05-01"
                  max="2026-06-30"
                />
                <input
                  type="text"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Time (optional, e.g. 09:00)"
                  value={newEvent.time}
                  onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button className="w-full mt-4" onClick={handleAddCustomEvent} disabled={!newEvent.date || !newEvent.title}>
                Add Event
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
