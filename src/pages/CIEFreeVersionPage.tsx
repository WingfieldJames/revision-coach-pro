import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotFullscreenPaths } from '@/components/ui/chatbot-fullscreen-paths';
import { RAGChat } from '@/components/RAGChat';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const CIE_PRODUCT_ID = "c3e5f8a1-9d4b-4c2e-8f1a-6b7c8d9e0f1a";

const CIE_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "What causes market failure?" },
];

export const CIEFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – CIE Economics A-Level Revision | Try Now"
        description="Try A* AI free for CIE/Cambridge Economics. AI trained on CIE past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/cie-free-version"
      />
      <ChatbotFullscreenPaths />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showPastPaperFinder
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="CIE Economics"
          toolsLocked 
          hideUserDetails 
          productId={CIE_PRODUCT_ID}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={CIE_PRODUCT_ID}
          subjectName="CIE Economics"
          subjectDescription="Your free CIE Economics revision assistant"
          footerText="A* AI can make mistakes. Verify important info."
          placeholder="Ask any CIE Economics question..."
          suggestedPrompts={CIE_ECONOMICS_FREE_PROMPTS}
          tier="free"
        />
      </div>
    </div>
  );
};
