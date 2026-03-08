import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_PRODUCT_ID = "6dc19d53-8a88-4741-9528-f25af97afb21";

const EDEXCEL_ECONOMICS_FREE_PROMPTS = [
  { text: "Find all PEQs related to externalities" },
  { text: "Explain Spec Point 2.2 (AD)" },
  { text: "How do I structure a 25 marker" },
  { text: "Give me application for trade agreements" },
];

export const FreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const sharedProps = {
    subjectName: "Edexcel Economics",
    productId: EDEXCEL_PRODUCT_ID,
    productSlug: "edexcel-economics",
    showMyAI: true,
    showGradeBoundaries: true,
    showPastPaperFinder: true,
    showRevisionGuide: true,
    revisionGuideBoard: "edexcel" as const,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: EDEXCEL_ECONOMICS_EXAMS,
    examSubjectName: "Edexcel Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          suggestedPrompts={EDEXCEL_ECONOMICS_FREE_PROMPTS}
          tier="deluxe"
          enableDiagrams
          diagramSubject="economics"
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
