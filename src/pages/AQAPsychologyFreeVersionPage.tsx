import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { AQA_PSYCHOLOGY_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const AQA_PSYCHOLOGY_PRODUCT_ID = "c56bc6d6-5074-4e1f-8bf2-8e900ba928ec";

const DEFAULT_PROMPTS = [
  { text: "Explain the difference between conformity and obedience" },
  { text: "What is the multi-store model of memory?" },
  { text: "How do I approach a 16-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAPsychologyFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(AQA_PSYCHOLOGY_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : AQA_PSYCHOLOGY_EXAMS;

  const sharedProps = {
    subjectName: "AQA Psychology",
    productId: AQA_PSYCHOLOGY_PRODUCT_ID,
    productSlug: "aqa-psychology",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', false),
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    pastPaperBoard: "aqa-psychology" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "aqa-psychology" as const,
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "AQA Psychology",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – AQA Psychology A-Level Revision | Try Now" description="Try A* AI free for AQA Psychology." canonical="https://astarai.co.uk/aqa-psychology-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_PSYCHOLOGY_PRODUCT_ID} subjectName="AQA Psychology" subjectDescription="Your personal A* Psychology tutor. Ask me anything!" footerText="Powered by A* AI • Trained on AQA Psychology specification" placeholder="Ask about social influence, memory, or attachment..." suggestedPrompts={prompts} chatRef={chatRef} />
      </div>
    </div>
  );
};
