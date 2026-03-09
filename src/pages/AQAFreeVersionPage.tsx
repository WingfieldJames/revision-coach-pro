import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const AQA_PRODUCT_ID = "17ade690-8c44-4961-83b5-0edf42a9faea";

const AQA_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const sharedProps = {
    subjectName: "AQA Economics",
    productId: AQA_PRODUCT_ID,
    productSlug: "aqa-economics",
    showMyAI: true,
    showPastPaperFinder: true,
    pastPaperBoard: "aqa" as const,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: AQA_ECONOMICS_EXAMS,
    examSubjectName: "AQA Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – AQA Economics A-Level Revision | Try Now" description="Try A* AI free for AQA Economics." canonical="https://astarai.co.uk/aqa-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_PRODUCT_ID} subjectName="AQA Economics" subjectDescription="Your free AQA Economics revision assistant" footerText="A* AI can make mistakes. Verify important info." placeholder="Ask any AQA Economics question..." suggestedPrompts={AQA_ECONOMICS_FREE_PROMPTS} enableDiagrams diagramSubject="economics" chatRef={chatRef} />
      </div>
    </div>
  );
};
