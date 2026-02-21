import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_MATHS_APPLIED_PRODUCT_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const EDEXCEL_MATHS_APPLIED_PROMPTS = [
  { text: "Explain Newton's second law problems" },
  { text: "How do I approach a hypothesis test?" },
  { text: "Help me with projectile motion questions" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsAppliedFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Maths Applied (Stats & Mechanics) | Try Now"
        description="Try A* AI free for Edexcel Mathematics Applied. AI tutor for Statistics and Mechanics. Upgrade to Deluxe for unlimited access."
        canonical="https://astarai.co.uk/edexcel-maths-applied-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showPastPaperFinder
          showGradeBoundaries
          gradeBoundariesSubject="maths"
          showExamCountdown
          examDates={EDEXCEL_MATHS_EXAMS}
          examSubjectName="Edexcel Maths"
          hideUserDetails 
          productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID}
          productSlug="edexcel-mathematics-applied"
          showUpgradeButton
          mathsMode="applied"
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID}
          subjectName="Edexcel Mathematics Applied"
          subjectDescription="Your personal A* Stats & Mechanics tutor. Ask me anything!"
          footerText="Powered by A* AI • Edexcel Mathematics Applied (Stats & Mechanics)"
          placeholder="Ask about statistics, mechanics, hypothesis testing..."
          suggestedPrompts={EDEXCEL_MATHS_APPLIED_PROMPTS}
        />
      </div>
    </div>
  );
};
