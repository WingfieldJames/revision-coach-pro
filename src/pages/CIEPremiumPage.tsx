import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const CIE_PRODUCT_ID = "c3e5f8a1-9d4b-4c2e-8f1a-6b7c8d9e0f1a";

const CIE_ECONOMICS_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const CIEPremiumPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – CIE Economics | Full Past Paper Training"
        description="Access A* AI Deluxe for CIE/Cambridge Economics. Full training on past papers, mark schemes, A* technique & unlimited prompts."
        canonical="https://astarai.co.uk/cie-premium"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="CIE Economics"
          hideUserDetails 
          productId={CIE_PRODUCT_ID}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={CIE_PRODUCT_ID}
          subjectName="CIE Economics Deluxe"
          subjectDescription="Your personal A* CIE Economics tutor with full past paper access. Ask me anything!"
          footerText="Powered by A* AI • Trained on CIE Economics specification"
          placeholder="Ask any CIE Economics question..."
          tier="deluxe"
          suggestedPrompts={CIE_ECONOMICS_PROMPTS}
          enableDiagrams
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
