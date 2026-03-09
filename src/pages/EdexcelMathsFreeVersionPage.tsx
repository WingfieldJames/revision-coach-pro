import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_MATHS_PRODUCT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const EDEXCEL_MATHS_PROMPTS = [
  { text: "Explain integration by parts" },
  { text: "How do I approach a proof question?" },
  { text: "Find past exam questions on differentiation" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const sharedProps = {
    subjectName: "Edexcel Maths (Pure)",
    productId: EDEXCEL_MATHS_PRODUCT_ID,
    productSlug: "edexcel-mathematics",
    showMyAI: true,
    showPastPaperFinder: true,
    pastPaperBoard: "edexcel-maths" as const,
    showRevisionGuide: true,
    revisionGuideBoard: "edexcel-maths" as const,
    showGradeBoundaries: true,
    gradeBoundariesSubject: "maths" as const,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: EDEXCEL_MATHS_EXAMS,
    examSubjectName: "Edexcel Maths",
    showMyMistakes: true,
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – Edexcel Mathematics A-Level Revision | Try Now" description="Try A* AI free for Edexcel Mathematics." canonical="https://astarai.co.uk/edexcel-maths-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={EDEXCEL_MATHS_PRODUCT_ID} subjectName="Edexcel Mathematics" subjectDescription="Your personal A* Maths tutor. Ask me anything!" footerText="Powered by A* AI • Trained on Edexcel Mathematics specification" placeholder="Ask about calculus, algebra, statistics..." suggestedPrompts={EDEXCEL_MATHS_PROMPTS} chatRef={chatRef} />
      </div>
    </div>
  );
};
