import React from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Economics A-Level Revision | Try Now"
        description="Try A* AI free – AI trained on Edexcel Economics past papers. Get spec-aligned responses and quick practice. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/free-version"
      />
      <RandomChatbotBackground />

      <ChatbotSidebar
        subjectName="Edexcel Economics"
        productId={EDEXCEL_PRODUCT_ID}
        productSlug="edexcel-economics"
        showMyAI
        showGradeBoundaries
        showPastPaperFinder
        showRevisionGuide
        revisionGuideBoard="edexcel"
        showExamCountdown
        examDates={EDEXCEL_ECONOMICS_EXAMS}
        examSubjectName="Edexcel Economics"
      />

      <ChatbotToolbar
        subjectName="Edexcel Economics"
        productId={EDEXCEL_PRODUCT_ID}
        productSlug="edexcel-economics"
        showMyAI
        showGradeBoundaries
        showPastPaperFinder
        showRevisionGuide
        revisionGuideBoard="edexcel"
        showExamCountdown
        examDates={EDEXCEL_ECONOMICS_EXAMS}
        examSubjectName="Edexcel Economics"
      />
      
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
        />
      </div>
    </div>
  );
};
