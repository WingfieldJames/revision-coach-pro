import React, { useState, useMemo } from 'react';
import { Search, FileSearch, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EDEXCEL_SPEC_POINTS, EDEXCEL_PAST_QUESTIONS, EdexcelSpecPoint, PastPaperQuestion } from '@/data/edexcelPastPapers';
import { AQA_SPEC_POINTS, AQA_PAST_QUESTIONS, AQASpecPoint, AQAPastPaperQuestion } from '@/data/aqaPastPapers';
import { OCR_CS_SPEC_POINTS, OCR_CS_PAST_QUESTIONS, OCRCSSpecPoint, OCRCSPastPaperQuestion } from '@/data/ocrCsPastPapers';
import { AQA_PSYCHOLOGY_SPEC_POINTS, AQA_PSYCHOLOGY_PAST_QUESTIONS } from '@/data/aqaPsychologyPastPapers';

// Unified types for the component
interface SpecPoint {
  code: string;
  name: string;
  keywords: string[];
}

interface Question {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
  extract?: string;
}

interface PastPaperFinderToolProps {
  tier?: 'free' | 'deluxe';
  productId?: string;
  board?: 'edexcel' | 'aqa' | 'ocr-cs' | 'aqa-psychology';
}

// Adapt spec points to unified type
function getSpecPoints(board: 'edexcel' | 'aqa' | 'ocr-cs' | 'aqa-psychology'): SpecPoint[] {
  if (board === 'ocr-cs') {
    return OCR_CS_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords }));
  }
  if (board === 'aqa') {
    return AQA_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords }));
  }
  if (board === 'aqa-psychology') {
    return AQA_PSYCHOLOGY_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords }));
  }
  return EDEXCEL_SPEC_POINTS.map(sp => ({ code: sp.code, name: sp.name, keywords: sp.keywords }));
}

function getQuestions(board: 'edexcel' | 'aqa' | 'ocr-cs' | 'aqa-psychology'): Question[] {
  if (board === 'ocr-cs') return OCR_CS_PAST_QUESTIONS;
  if (board === 'aqa') return AQA_PAST_QUESTIONS;
  if (board === 'aqa-psychology') return AQA_PSYCHOLOGY_PAST_QUESTIONS;
  return EDEXCEL_PAST_QUESTIONS;
}

function getBoardLabel(board: 'edexcel' | 'aqa' | 'ocr-cs' | 'aqa-psychology'): string {
  if (board === 'ocr-cs') return 'OCR CS';
  if (board === 'aqa-psychology') return 'AQA Psychology';
  return board === 'aqa' ? 'AQA' : 'Edexcel';
}

export const PastPaperFinderTool: React.FC<PastPaperFinderToolProps> = ({
  tier = 'free',
  board = 'edexcel',
}: { tier?: 'free' | 'deluxe'; productId?: string; board?: 'edexcel' | 'aqa' | 'ocr-cs' | 'aqa-psychology' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<SpecPoint | null>(null);
  const [showResults, setShowResults] = useState(false);

  const specPoints = useMemo(() => getSpecPoints(board), [board]);
  const questions = useMemo(() => getQuestions(board), [board]);

  // Filter spec points based on search query
  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return specPoints.filter(spec => {
      const nameMatch = spec.name.toLowerCase().includes(query);
      const codeMatch = spec.code.toLowerCase().includes(query);
      const keywordMatch = spec.keywords.some(kw => kw.includes(query));
      return nameMatch || codeMatch || keywordMatch;
    }).slice(0, 8);
  }, [searchQuery, specPoints]);

  // Find questions matching selected spec point
  const matchedQuestions = useMemo(() => {
    if (!selectedSpec) return [];
    return questions.filter(q =>
      q.specCodes.some(code => code === selectedSpec.code)
    ).sort((a, b) => b.year - a.year || a.number.localeCompare(b.number));
  }, [selectedSpec, questions]);

  const handleSearch = () => {
    if (selectedSpec) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedSpec(null);
    setShowResults(false);
  };

  const handleSpecClick = (spec: SpecPoint) => {
    setSelectedSpec(spec);
    setSearchQuery(spec.name);
  };

  const boardLabel = getBoardLabel(board);
  const placeholderText = board === 'ocr-cs'
    ? "Enter a topic... e.g. binary search, TCP/IP, SQL"
    : board === 'aqa'
    ? "Enter a topic... e.g. externalities, AD, monopoly"
    : board === 'aqa-psychology'
    ? "Enter a topic... e.g. conformity, attachment, memory"
    : "Enter a topic... e.g. externalities, AD, tariffs";
  const hintText = board === 'ocr-cs'
    ? '"sorting algorithms", "databases", "encryption", "OOP"'
    : board === 'aqa'
    ? '"externalities", "fiscal policy", "monopoly", "trade unions"'
    : board === 'aqa-psychology'
    ? '"conformity", "Milgram", "working memory", "attachment"'
    : '"externalities", "fiscal policy", "oligopoly", "exchange rates"';

  // Results view
  if (showResults && selectedSpec) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <FileSearch className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">{boardLabel} Past Paper Finder</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedSpec.code}: {selectedSpec.name}
            </p>
          </div>
        </div>

        {tier === 'free' && (
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              📚 Free version — showing <span className="font-medium">2023–2024</span> papers only
            </p>
          </div>
        )}

        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
          {matchedQuestions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No questions found for this spec point in 2023–2024 papers.</p>
            </div>
          ) : (
            matchedQuestions.map((q, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-primary">
                    {q.paper} • June {q.year} • Section {q.section}
                  </span>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">Q{q.number}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{q.question}</p>
                {q.extract && (
                  <p className="text-xs text-muted-foreground/70 mt-1.5 italic border-l-2 border-primary/30 pl-2">
                    {q.extract}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
          Search Another Topic
        </Button>
      </div>
    );
  }

  // Search view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <FileSearch className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{boardLabel} Past Paper Finder</h3>
          <p className="text-xs text-muted-foreground">
            Search by topic to find past exam questions
          </p>
        </div>
      </div>

      {tier === 'free' && (
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">
            📚 Free version — trained on <span className="font-medium">2023–2024</span> papers only
          </p>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedSpec(null);
            setShowResults(false);
          }}
          placeholder={placeholderText}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Spec point suggestions */}
      {filteredSpecs.length > 0 && !selectedSpec && (
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Select a spec point:</p>
          {filteredSpecs.map((spec) => (
            <button
              key={spec.code}
              onClick={() => handleSpecClick(spec)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-primary">{spec.code}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{spec.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Selected spec point indicator */}
      {selectedSpec && (
        <div className="bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-primary">{selectedSpec.code}</span>
            <span className="text-xs text-foreground ml-1.5">{selectedSpec.name}</span>
          </div>
          <button
            onClick={() => { setSelectedSpec(null); setSearchQuery(''); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search button */}
      <Button
        onClick={handleSearch}
        disabled={!selectedSpec}
        className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
        size="sm"
      >
        <Search className="w-4 h-4 mr-2" />
        Search Past Papers
      </Button>

      {/* Empty state hint */}
      {!searchQuery && (
        <p className="text-xs text-center text-muted-foreground">
          Try: {hintText}
        </p>
      )}
    </div>
  );
};
