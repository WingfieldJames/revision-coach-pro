import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const EDEXCEL_PRODUCT_ID = "6dc19d53-8a88-4741-9528-f25af97afb21";

const DEFAULT_PROMPTS = [
  { text: "Find all PEQs related to externalities" },
  { text: "Explain Spec Point 2.2 (AD)" },
  { text: "How do I structure a 25 marker" },
  { text: "Give me application for trade agreements" },
];

export const FreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(EDEXCEL_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : EDEXCEL_ECONOMICS_EXAMS;

  const sharedProps = {
    subjectName: "Edexcel Economics",
    productId: EDEXCEL_PRODUCT_ID,
    productSlug: "edexcel-economics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "economics" as const,
    customDiagramData: tc.diagram_library.length > 0 ? tc.diagram_library : undefined,
    showGradeBoundaries: resolveFeature(tc, 'grade_boundaries', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "edexcel" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "Edexcel Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customPastPaperContent: <DynamicPastPaperFinder productId={EDEXCEL_PRODUCT_ID} subjectName="Edexcel Economics" tier="free" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={EDEXCEL_PRODUCT_ID} subjectName="Edexcel Economics" tier="free" />,
  };

  return (
    <div className="min-h-screen bg-chat-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Economics A-Level Revision | Try Now"
        description="Try A* AI free – AI trained on Edexcel Economics past papers. Get spec-aligned responses and quick practice. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/free-version"
      />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_PRODUCT_ID}
          subjectName="Edexcel Economics"
          subjectDescription="Your free Edexcel Economics revision assistant"
          footerText="A* AI can make mistakes. Verify important info."
          placeholder="Ask any Edexcel Economics question..."
          suggestedPrompts={prompts}
          tier="deluxe"
          enableDiagrams
          diagramSubject="economics"
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
