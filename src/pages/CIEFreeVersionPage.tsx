import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { CIE_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

const CIE_PRODUCT_ID = "9a710cf9-0523-4c1f-82c6-0e02b19087e5";

const CIE_ECONOMICS_FREE_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const CIEFreeVersionPage = () => {
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – CIE Economics A-Level Revision | Try Now" description="Try A* AI free for CIE/Cambridge Economics." canonical="https://astarai.co.uk/cie-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="CIE Economics" productId={CIE_PRODUCT_ID} productSlug="cie-economics" showMyAI showPastPaperFinder showExamCountdown examDates={CIE_ECONOMICS_EXAMS} examSubjectName="CIE Economics" />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-2"><div className="flex items-center pl-12"><Link to="/" className="flex items-center"><img src={currentLogo} alt="A* AI logo" className="h-12 sm:h-14" /></Link></div></div>
      <div className="flex-1 relative z-10">
        <RAGChat productId={CIE_PRODUCT_ID} subjectName="CIE Economics" subjectDescription="Your free CIE Economics revision assistant" footerText="A* AI can make mistakes. Verify important info." placeholder="Ask any CIE Economics question..." suggestedPrompts={CIE_ECONOMICS_FREE_PROMPTS} enableDiagrams diagramSubject="economics" />
      </div>
    </div>
  );
};
