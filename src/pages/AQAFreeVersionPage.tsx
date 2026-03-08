import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const AQA_PRODUCT_ID = "17ade690-8c44-4961-83b5-0edf42a9faea";

const AQA_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – AQA Economics A-Level Revision | Try Now"
        description="Try A* AI free for AQA Economics. AI trained on AQA past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showPastPaperFinder
          pastPaperBoard="aqa"
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="AQA Economics"
          hideUserDetails 
          productId={AQA_PRODUCT_ID}
          productSlug="aqa-economics"
          showUpgradeButton
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={AQA_PRODUCT_ID}
          subjectName="AQA Economics"
          subjectDescription="Your free AQA Economics revision assistant"
          footerText="A* AI can make mistakes. Verify important info."
          placeholder="Ask any AQA Economics question..."
          suggestedPrompts={AQA_ECONOMICS_FREE_PROMPTS}
          enableDiagrams
          diagramSubject="economics"
        />
      </div>
    </div>
  );
};
