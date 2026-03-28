import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';

const EDEXCEL_MATHS_PRODUCT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const DEFAULT_PROMPTS = [
  { text: "Explain integration by parts" },
  { text: "How do I approach a proof question?" },
  { text: "Find past exam questions on differentiation" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const tc = useTrainerConfig(EDEXCEL_MATHS_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const handleModeChange = (mode: 'pure' | 'applied') => {
    if (mode === 'applied') {
      navigate(location.pathname.includes('premium') ? '/edexcel-maths-applied-premium' : '/edexcel-maths-applied-free-version');
    }
  };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : EDEXCEL_MATHS_EXAMS;

  const sharedProps = {
    subjectName: "Edexcel Maths (Pure)",
    productId: EDEXCEL_MATHS_PRODUCT_ID,
    productSlug: "edexcel-mathematics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    pastPaperBoard: "edexcel-maths" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "edexcel-maths" as const,
    showGradeBoundaries: resolveFeature(tc, 'grade_boundaries', true),
    showGraphSketcher: true,
    gradeBoundariesSubject: "maths" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    examDates,
    examSubjectName: "Edexcel Maths",
    showMyMistakes: resolveFeature(tc, 'my_mistakes', true),
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={EDEXCEL_MATHS_PRODUCT_ID} subjectName="Edexcel Maths (Pure)" tier="free" />,
    customPastPaperContent: <DynamicPastPaperFinder productId={EDEXCEL_MATHS_PRODUCT_ID} subjectName="Edexcel Maths (Pure)" tier="free" />,
    showMathsModeSwitcher: true,
    mathsMode: 'pure' as const,
    onMathsModeChange: handleModeChange,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – Edexcel Mathematics A-Level Revision | Try Now" description="Try A* AI free for Edexcel Mathematics." canonical="https://astarai.co.uk/edexcel-maths-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={EDEXCEL_MATHS_PRODUCT_ID} subjectName="Edexcel Mathematics" subjectDescription="Your personal A* Maths tutor. Ask me anything!" footerText="Powered by A* AI • Trained on Edexcel Mathematics specification" placeholder="Ask about calculus, algebra, statistics..." suggestedPrompts={prompts} chatRef={chatRef} examDates={examDates} promptLabels={['Method', 'Proof', 'Past papers', 'Revision']} />
      </div>
    </div>
  );
};
