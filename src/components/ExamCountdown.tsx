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
  
  // Sort exams by date
  const sortedExams = [...exams].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate days until first exam
  const firstExam = sortedExams[0];
  const daysUntilFirst = Math.ceil((firstExam.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total timeline span (from today to last exam)
  const lastExam = sortedExams[sortedExams.length - 1];
  const totalSpan = lastExam.date.getTime() - today.getTime();
  
  // Calculate position for each point (0 = today, 100 = last exam)
  const getPosition = (date: Date) => {
    const diff = date.getTime() - today.getTime();
    return (diff / totalSpan) * 100;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (date: Date) => {
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <Timer className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{subjectName} Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {daysUntilFirst} days until first exam
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative py-4 pl-4">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary to-primary/30" />
        
        {/* Today marker */}
        <div className="relative flex items-center mb-6">
          <div className="absolute left-0 w-6 h-6 rounded-full bg-primary border-4 border-background shadow-lg z-10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-background" />
          </div>
          <div className="ml-10">
            <p className="text-sm font-semibold text-primary">Today</p>
            <p className="text-xs text-muted-foreground">{formatDate(today)}</p>
          </div>
        </div>

        {/* Exam markers */}
        {sortedExams.map((exam, index) => {
          const position = getPosition(exam.date);
          const daysUntil = getDaysUntil(exam.date);
          
          // Calculate proportional spacing
          const prevDate = index === 0 ? today : sortedExams[index - 1].date;
          const daysBetween = Math.ceil((exam.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          const minHeight = 48; // minimum height in pixels
          const heightPerDay = 2; // pixels per day
          const marginTop = Math.max(minHeight, daysBetween * heightPerDay);

          return (
            <div 
              key={exam.name} 
              className="relative flex items-center"
              style={{ marginTop: `${marginTop}px` }}
            >
              <div className="absolute left-0 w-6 h-6 rounded-full bg-background border-2 border-primary shadow-md z-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="ml-10">
                <p className="text-sm font-semibold text-foreground">{exam.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(exam.date)}</p>
                <p className="text-xs text-primary font-medium">{daysUntil} days</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {sortedExams.length} exams • {getDaysUntil(lastExam.date)} days total revision time
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
