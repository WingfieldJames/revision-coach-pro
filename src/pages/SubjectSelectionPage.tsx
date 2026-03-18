import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

import { supabase } from '@/lib/supabase';

interface SubjectOption {
  label: string;
  slug: string;
  boards: string[];
  comingSoon?: boolean;
}

const A_LEVEL_SUBJECTS: SubjectOption[] = [
  { label: 'Economics', slug: 'economics', boards: ['Edexcel', 'AQA', 'CIE'] },
  { label: 'Computer Science', slug: 'computer-science', boards: ['OCR'] },
  { label: 'Physics', slug: 'physics', boards: ['OCR'] },
  { label: 'Chemistry', slug: 'chemistry', boards: ['AQA'] },
  { label: 'Psychology', slug: 'psychology', boards: ['AQA'] },
  { label: 'Mathematics', slug: 'mathematics', boards: ['Edexcel'] },
  { label: 'Biology', slug: 'biology', boards: [], comingSoon: true },
  { label: 'Politics', slug: 'politics', boards: [], comingSoon: true },
];

export const SubjectSelectionPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  const [selectedLevel, setSelectedLevel] = useState<'alevel' | 'gcse' | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectOption[]>([]);
  const [dynamicALevelSubjects, setDynamicALevelSubjects] = useState<SubjectOption[]>([]);
  const [boardMerges, setBoardMerges] = useState<Record<string, string[]>>({});
  const subjectsRef = useRef<HTMLDivElement>(null);

  // Load dynamic A-Level subjects from products table
  useEffect(() => {
    const loadDynamic = async () => {
      const { data } = await supabase
        .from('products')
        .select('subject, exam_board, slug, qualification_type')
        .eq('active', true);

      if (!data) return;

      // Merge dynamic A-Level products into the static list
      const aLevelProducts = data.filter((p: any) => (p as any).qualification_type !== 'GCSE');
      // Skip "mathematics-applied" — it's a mode inside the Mathematics bot
      const filtered = aLevelProducts.filter((p: any) => (p as any).subject.toLowerCase().replace(/\s+/g, '-') !== 'mathematics-applied');
      const existingSlugs = new Set(A_LEVEL_SUBJECTS.map(s => s.slug));

      // Merge extra boards into existing static subjects
      const boardMerges: Record<string, string[]> = {};
      const dynamicExtras: SubjectOption[] = [];

      for (const p of filtered) {
        const subjectSlug = (p as any).subject.toLowerCase().replace(/\s+/g, '-');
        const board = (p as any).exam_board;

        if (existingSlugs.has(subjectSlug)) {
          // Merge board into existing subject if not already present
          if (!boardMerges[subjectSlug]) boardMerges[subjectSlug] = [];
          if (!boardMerges[subjectSlug].includes(board)) boardMerges[subjectSlug].push(board);
        } else {
          // Check if we already added this subject
          const existing = dynamicExtras.find(d => d.slug === subjectSlug);
          if (existing) {
            if (!existing.boards.includes(board)) existing.boards.push(board);
          } else {
            dynamicExtras.push({
              label: (p as any).subject.charAt(0).toUpperCase() + (p as any).subject.slice(1),
              slug: subjectSlug,
              boards: [board],
            });
          }
        }
      }

      // Apply board merges to static subjects
      setBoardMerges(boardMerges);
      setDynamicALevelSubjects(dynamicExtras);
    };
    loadDynamic();
  }, []);

  const allALevelSubjects = [
    ...A_LEVEL_SUBJECTS.map(s => {
      const extra = boardMerges[s.slug];
      if (!extra) return s;
      const merged = [...s.boards];
      for (const b of extra) { if (!merged.includes(b)) merged.push(b); }
      return { ...s, boards: merged };
    }),
    ...dynamicALevelSubjects,
  ];

  const handleGCSE = () => {
    navigate('/gcse');
  };

  const handleSubjectSelect = (subject: SubjectOption) => {
    if (subject.comingSoon) return;
    setSelectedSubjects((prev) => {
      const isSelected = prev.some((s) => s.slug === subject.slug);
      if (isSelected) return prev.filter((s) => s.slug !== subject.slug);
      return [...prev, subject];
    });
  };

  const handleNext = () => {
    if (selectedSubjects.length === 0) return;
    navigate('/compare');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Choose Your Subject | A* AI"
        description="Pick your qualification level and subject to start revising with A* AI."
        canonical="https://astarai.co.uk/select"
      />
      <FlowFieldBackground />
      <Header />

      <div className="flex-1 relative z-10 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img src={currentLogo} alt="A* AI" className="h-10 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pick your subject</h1>
            <p className="text-muted-foreground mt-2">Choose your qualification level to get started</p>
          </div>

          {/* Level Selection */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={handleGCSE}
              className={`rounded-xl border-2 p-6 text-center transition-all hover:border-primary/50 border-border`}
            >
              <p className="text-xl font-bold">GCSE</p>
              <p className="text-xs text-muted-foreground mt-1">Years 10–11</p>
            </button>
            <button
              onClick={() => navigate('/compare')}
              className="rounded-xl border-2 p-6 text-center transition-all border-border hover:border-primary/50"
            >
              <p className="text-xl font-bold">A-Level</p>
              <p className="text-xs text-muted-foreground mt-1">Years 12–13</p>
            </button>
          </div>

          {/* A-Level Subject Dropdown */}
          <AnimatePresence>
            {selectedLevel === 'alevel' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div ref={subjectsRef} className="space-y-4">
                  <p className="text-center text-sm font-medium text-muted-foreground">Select your subject</p>
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {allALevelSubjects.map((subject) => (
                      <button
                        key={subject.slug}
                        onClick={() => handleSubjectSelect(subject)}
                        disabled={subject.comingSoon}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                          subject.comingSoon
                            ? 'border-border opacity-50 cursor-not-allowed'
                            : selectedSubjects.some((s) => s.slug === subject.slug)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{subject.label}</p>
                          {subject.comingSoon && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        {subject.comingSoon ? (
                          <p className="text-xs text-muted-foreground mt-0.5">Coming soon</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {subject.boards.join(', ')}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Next button */}
                  <AnimatePresence>
                    {selectedSubjects.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex justify-center pt-2"
                      >
                        <Button
                          size="lg"
                          onClick={handleNext}
                          className="px-8"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
