import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { AQA_CHEMISTRY_EXAMS } from '@/components/ExamCountdown';

// AQA Chemistry product ID from database
const AQA_CHEMISTRY_PRODUCT_ID = "3e5bf02e-1424-4bb3-88f9-2a9c58798444";

const AQA_CHEMISTRY_PROMPTS = [
  { text: "Explain the mechanism of nucleophilic substitution" },
  { text: "What is Le Chatelier's principle?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAChemistryFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – AQA Chemistry A-Level Revision | Try Now"
        description="Try A* AI free for AQA Chemistry. AI trained on AQA Chemistry past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-chemistry-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={AQA_CHEMISTRY_EXAMS}
          examSubjectName="AQA Chemistry"
          hideUserDetails 
          productId={AQA_CHEMISTRY_PRODUCT_ID}
          productSlug="aqa-chemistry"
          showUpgradeButton
          essayMarkerLabel="6-Marker Analysis"
          essayMarkerFixedMark={6}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={AQA_CHEMISTRY_PRODUCT_ID}
          subjectName="AQA Chemistry"
          subjectDescription="Your personal A* Chemistry tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on AQA Chemistry specification"
          placeholder="Ask about organic, inorganic, or physical chemistry..."
          suggestedPrompts={AQA_CHEMISTRY_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
