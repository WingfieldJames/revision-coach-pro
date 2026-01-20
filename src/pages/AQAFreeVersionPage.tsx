import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RAGChat } from '@/components/RAGChat';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const AQA_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation", personalize: false },
  { text: "What are the characteristics of perfect competition?", personalize: false },
  { text: "Help me understand the Phillips Curve", personalize: false },
  { text: "What causes market failure?", personalize: false },
];

export const AQAFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – AQA Economics A-Level Revision | Try Now"
        description="Try A* AI free for AQA Economics. AI trained on AQA past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-free-version"
      />
      <div className="relative z-10">
        <Header 
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="AQA Economics"
          toolsLocked 
          hideUserDetails 
        />
      </div>
      
      <RAGChat 
        productId="17ade690-8c44-4961-83b5-0edf42a9faea"
        subjectName="AQA Economics"
        subjectDescription="Your free AQA Economics revision assistant"
        footerText="A* AI can make mistakes. Verify important info."
        placeholder="Ask any AQA Economics question..."
        suggestedPrompts={AQA_ECONOMICS_FREE_PROMPTS}
        tier="free"
      />
    </div>
  );
};
