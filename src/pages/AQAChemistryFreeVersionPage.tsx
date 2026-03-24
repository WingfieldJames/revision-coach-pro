import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { AQA_CHEMISTRY_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';

const AQA_CHEMISTRY_PRODUCT_ID = "3e5bf02e-1424-4bb3-88f9-2a9c58798444";

const DEFAULT_PROMPTS = [
  { text: "Explain the mechanism of nucleophilic substitution" },
  { text: "What is Le Chatelier's principle?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAChemistryFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(AQA_CHEMISTRY_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : AQA_CHEMISTRY_EXAMS;

  const sharedProps = {
    subjectName: "AQA Chemistry",
    productId: AQA_CHEMISTRY_PRODUCT_ID,
    productSlug: "aqa-chemistry",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', false),
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showRevisionGuide: resolveFeature(tc, 'revision_guide', false),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "AQA Chemistry",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={AQA_CHEMISTRY_PRODUCT_ID} subjectName="AQA Chemistry" tier="free" />,
    customPastPaperContent: <DynamicPastPaperFinder productId={AQA_CHEMISTRY_PRODUCT_ID} subjectName="AQA Chemistry" tier="free" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – AQA Chemistry A-Level Revision | Try Now" description="Try A* AI free for AQA Chemistry." canonical="https://astarai.co.uk/aqa-chemistry-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_CHEMISTRY_PRODUCT_ID} subjectName="AQA Chemistry" subjectDescription="Your personal A* Chemistry tutor. Ask me anything!" footerText="Powered by A* AI • Trained on AQA Chemistry specification" placeholder="Ask about organic, inorganic, or physical chemistry..." suggestedPrompts={prompts} chatRef={chatRef} examDates={examDates} promptLabels={['Mechanism', 'Concept', 'Exam technique', 'Revision']} />
      </div>
    </div>
  );
};
