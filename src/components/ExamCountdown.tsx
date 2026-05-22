import React from 'react';
import { Timer } from 'lucide-react';

export interface ExamDate {
  name: string;
  date: Date;
  description?: string;
}

interface ExamCountdownProps {
  exams: ExamDate[];
  subjectName?: string;
}

export const ExamCountdown: React.FC<ExamCountdownProps> = ({ exams, subjectName = "Exams" }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedExams = [...exams].sort((a, b) => a.date.getTime() - b.date.getTime());

  const getDaysUntil = (date: Date) => {
    return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const upcomingExams = sortedExams.filter(e => getDaysUntil(e.date) >= 0);
  const pastExams = sortedExams.filter(e => getDaysUntil(e.date) < 0);
  const allDone = upcomingExams.length === 0;

  const nextExam = upcomingExams[0] ?? null;
  const daysUntilNext = nextExam ? getDaysUntil(nextExam.date) : null;
  const lastUpcoming = upcomingExams[upcomingExams.length - 1] ?? null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 exam-countdown-panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <Timer className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{subjectName} Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {allDone
              ? "All exams complete — well done!"
              : daysUntilNext === 0
                ? "Next exam is today!"
                : `${daysUntilNext} days until next exam`}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative py-4 pl-4">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 panel-timeline-line" />

        {/* Past exams */}
        {pastExams.map((exam, index) => {
          const prevDate = index === 0 ? sortedExams[0].date : pastExams[index - 1].date;
          const daysBetween = Math.ceil(Math.abs(exam.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          const marginTop = index === 0 ? 0 : Math.max(40, daysBetween * 2);

          return (
            <div
              key={exam.name}
              className="relative flex items-center opacity-40"
              style={{ marginTop: `${marginTop}px` }}
            >
              <div className="absolute left-0 w-6 h-6 rounded-full bg-background panel-dot-outline shadow-md z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full panel-dot-inner" />
              </div>
              <div className="ml-10">
                <p className="text-sm font-semibold text-foreground line-through">{exam.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(exam.date)}</p>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
              </div>
            </div>
          );
        })}

        {/* Today marker */}
        <div className="relative flex items-center" style={{ marginTop: pastExams.length > 0 ? '24px' : '0' }}>
          <div className="absolute left-0 w-6 h-6 rounded-full panel-dot-filled border-4 border-background shadow-lg z-10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-background" />
          </div>
          <div className="ml-10">
            <p className="text-sm font-semibold panel-accent-text">Today</p>
            <p className="text-xs text-muted-foreground">{formatDate(today)}</p>
          </div>
        </div>

        {/* Upcoming exam markers */}
        {upcomingExams.map((exam, index) => {
          const prevDate = index === 0 ? today : upcomingExams[index - 1].date;
          const daysBetween = Math.ceil((exam.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          const marginTop = Math.max(48, daysBetween * 2);

          return (
            <div
              key={exam.name}
              className="relative flex items-center"
              style={{ marginTop: `${marginTop}px` }}
            >
              <div className="absolute left-0 w-6 h-6 rounded-full bg-background panel-dot-outline shadow-md z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full panel-dot-inner" />
              </div>
              <div className="ml-10">
                <p className="text-sm font-semibold text-foreground">{exam.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(exam.date)}</p>
                <p className="text-xs panel-accent-text font-medium">
                  {getDaysUntil(exam.date) === 0 ? "Today!" : `${getDaysUntil(exam.date)} days`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {allDone
            ? `All ${sortedExams.length} exams complete`
            : lastUpcoming
              ? `${upcomingExams.length} exam${upcomingExams.length !== 1 ? 's' : ''} remaining • ${getDaysUntil(lastUpcoming.date)} days to go`
              : `${sortedExams.length} exams`}
        </p>
      </div>
    </div>
  );
};

// Pre-configured exam data for different subjects
export const AQA_ECONOMICS_EXAMS: ExamDate[] = [
  { name: "Paper 1", date: new Date(2026, 4, 11), description: "Markets and Market Failure" },
  { name: "Paper 2", date: new Date(2026, 4, 18), description: "National and International Economy" },
  { name: "Paper 3", date: new Date(2026, 5, 4), description: "Economic Principles and Issues" },
];

export const EDEXCEL_ECONOMICS_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Markets and Business Behaviour)", date: new Date(2026, 4, 11), description: "Markets and Business Behaviour" },
  { name: "Paper 2 (The National and Global Economy)", date: new Date(2026, 4, 18), description: "The National and Global Economy" },
  { name: "Paper 3 (Microeconomics and Macroeconomics)", date: new Date(2026, 5, 4), description: "Microeconomics and Macroeconomics" },
];

export const OCR_CS_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Computer Systems)", date: new Date(2026, 5, 10), description: "Computer Systems" },
  { name: "Paper 2 (Algorithms & Programming)", date: new Date(2026, 5, 17), description: "Algorithms and Programming" },
];

export const OCR_PHYSICS_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Modelling Physics)", date: new Date(2026, 4, 20), description: "Modelling Physics" },
  { name: "Paper 2 (Exploring Physics)", date: new Date(2026, 5, 1), description: "Exploring Physics" },
  { name: "Paper 3 (Unified Physics)", date: new Date(2026, 5, 8), description: "Unified Physics" },
];

export const AQA_CHEMISTRY_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Inorganic & Physical)", date: new Date(2026, 4, 13), description: "Inorganic and Physical Chemistry" },
  { name: "Paper 2 (Organic & Physical)", date: new Date(2026, 4, 20), description: "Organic and Physical Chemistry" },
  { name: "Paper 3 (Practical)", date: new Date(2026, 5, 10), description: "Practical Chemistry" },
 ];
 
 export const AQA_PSYCHOLOGY_EXAMS: ExamDate[] = [
   { name: "Paper 1 (Introductory Topics)", date: new Date(2026, 4, 14), description: "Introductory Topics in Psychology" },
   { name: "Paper 2 (Psychology in Context)", date: new Date(2026, 4, 27), description: "Psychology in Context" },
   { name: "Paper 3 (Issues and Options)", date: new Date(2026, 5, 8), description: "Issues and Options in Psychology" },
 ];

export const EDEXCEL_MATHS_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Pure Mathematics 1)", date: new Date(2026, 5, 2), description: "Pure Mathematics 1" },
  { name: "Paper 2 (Pure Mathematics 2)", date: new Date(2026, 5, 9), description: "Pure Mathematics 2" },
  { name: "Paper 3 (Statistics & Mechanics)", date: new Date(2026, 5, 15), description: "Statistics and Mechanics" },
];

export const CIE_ECONOMICS_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Multiple Choice)", date: new Date(2026, 4, 12), description: "AS Multiple Choice" },
  { name: "Paper 2 (Data Response & Essays)", date: new Date(2026, 4, 22), description: "AS Data Response and Essays" },
  { name: "Paper 3 (Multiple Choice)", date: new Date(2026, 5, 3), description: "A Level Multiple Choice" },
  { name: "Paper 4 (Data Response & Essays)", date: new Date(2026, 5, 12), description: "A Level Data Response and Essays" },
];
