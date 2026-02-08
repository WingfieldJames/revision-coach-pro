import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_MATHS_PRODUCT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const EDEXCEL_MATHS_PROMPTS = [
  { text: "Explain integration by parts" },
  { text: "How do I approach a proof question?" },
  { text: "Find past exam questions on differentiation" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Mathematics A-Level Revision | Try Now"
        description="Try A* AI free for Edexcel Mathematics. AI trained on Edexcel Maths past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/edexcel-maths-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showPastPaperFinder
          showExamCountdown
          examDates={EDEXCEL_MATHS_EXAMS}
          examSubjectName="Edexcel Maths"
          hideUserDetails 
          productId={EDEXCEL_MATHS_PRODUCT_ID}
          productSlug="edexcel-mathematics"
          showUpgradeButton
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_MATHS_PRODUCT_ID}
          subjectName="Edexcel Mathematics"
          subjectDescription="Your personal A* Maths tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on Edexcel Mathematics specification"
          placeholder="Ask about calculus, algebra, statistics..."
          suggestedPrompts={EDEXCEL_MATHS_PROMPTS}
        />
      </div>
    </div>
  );
};
