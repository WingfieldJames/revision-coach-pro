import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { AQA_PSYCHOLOGY_EXAMS } from '@/components/ExamCountdown';

// AQA Psychology product ID from database
const AQA_PSYCHOLOGY_PRODUCT_ID = "c56bc6d6-5074-4e1f-8bf2-8e900ba928ec";

const AQA_PSYCHOLOGY_PROMPTS = [
  { text: "Explain the difference between conformity and obedience" },
  { text: "What is the multi-store model of memory?" },
  { text: "How do I approach a 16-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAPsychologyFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – AQA Psychology A-Level Revision | Try Now"
        description="Try A* AI free for AQA Psychology. AI trained on AQA Psychology past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-psychology-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={AQA_PSYCHOLOGY_EXAMS}
          examSubjectName="AQA Psychology"
          hideUserDetails 
          productId={AQA_PSYCHOLOGY_PRODUCT_ID}
          productSlug="aqa-psychology"
          showUpgradeButton
          essayMarkerLabel="16-Marker Analysis"
          essayMarkerFixedMark={16}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={AQA_PSYCHOLOGY_PRODUCT_ID}
          subjectName="AQA Psychology"
          subjectDescription="Your personal A* Psychology tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on AQA Psychology specification"
          placeholder="Ask about social influence, memory, or attachment..."
          suggestedPrompts={AQA_PSYCHOLOGY_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
