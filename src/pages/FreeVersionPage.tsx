import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotFullscreenPaths } from '@/components/ui/chatbot-fullscreen-paths';
import { RAGChat } from '@/components/RAGChat';
import { EDEXCEL_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_PRODUCT_ID = "6dc19d53-8a88-4741-9528-f25af97afb21";

const EDEXCEL_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "What causes market failure?" },
];

export const FreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Economics A-Level Revision | Try Now"
        description="Try A* AI free – AI trained on Edexcel Economics past papers. Get spec-aligned responses and quick practice. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/free-version"
      />
      <ChatbotFullscreenPaths />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showExamCountdown
          examDates={EDEXCEL_ECONOMICS_EXAMS}
          examSubjectName="Edexcel Economics"
          toolsLocked 
          hideUserDetails 
          productId={EDEXCEL_PRODUCT_ID}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_PRODUCT_ID}
          subjectName="Edexcel Economics"
          subjectDescription="Your free Edexcel Economics revision assistant"
          footerText="A* AI can make mistakes. Verify important info."
          placeholder="Ask any Edexcel Economics question..."
          suggestedPrompts={EDEXCEL_ECONOMICS_FREE_PROMPTS}
          tier="free"
        />
      </div>
    </div>
  );
};
