import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { CIE_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const CIE_PRODUCT_ID = "9a710cf9-0523-4c1f-82c6-0e02b19087e5";

const CIE_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const CIEFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const sharedProps = {
    subjectName: "CIE Economics",
    productId: CIE_PRODUCT_ID,
    productSlug: "cie-economics",
    showMyAI: true,
    showPastPaperFinder: true,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: CIE_ECONOMICS_EXAMS,
    examSubjectName: "CIE Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – CIE Economics A-Level Revision | Try Now" description="Try A* AI free for CIE/Cambridge Economics." canonical="https://astarai.co.uk/cie-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={CIE_PRODUCT_ID} subjectName="CIE Economics" subjectDescription="Your free CIE Economics revision assistant" footerText="A* AI can make mistakes. Verify important info." placeholder="Ask any CIE Economics question..." suggestedPrompts={CIE_ECONOMICS_FREE_PROMPTS} enableDiagrams diagramSubject="economics" chatRef={chatRef} />
      </div>
    </div>
  );
};
