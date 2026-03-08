import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

const EDEXCEL_MATHS_APPLIED_PRODUCT_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const EDEXCEL_MATHS_APPLIED_PROMPTS = [
  { text: "Explain Newton's second law problems" },
  { text: "How do I approach a hypothesis test?" },
  { text: "Help me with projectile motion questions" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsAppliedFreeVersionPage = () => {
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – Edexcel Maths Applied (Stats & Mechanics) | Try Now" description="Try A* AI free for Edexcel Mathematics Applied." canonical="https://astarai.co.uk/edexcel-maths-applied-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="Edexcel Maths (Applied)" productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} productSlug="edexcel-mathematics-applied" showMyAI showPastPaperFinder pastPaperBoard="edexcel-maths-applied" showRevisionGuide revisionGuideBoard="edexcel-maths-applied" showGradeBoundaries gradeBoundariesSubject="maths" showExamCountdown examDates={EDEXCEL_MATHS_EXAMS} examSubjectName="Edexcel Maths" showMyMistakes />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-2"><div className="flex items-center pl-12"><Link to="/" className="flex items-center"><img src={currentLogo} alt="A* AI logo" className="h-12 sm:h-14" /></Link></div></div>
      <div className="flex-1 relative z-10">
        <RAGChat productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} subjectName="Edexcel Mathematics Applied" subjectDescription="Your personal A* Stats & Mechanics tutor. Ask me anything!" footerText="Powered by A* AI • Edexcel Mathematics Applied (Stats & Mechanics)" placeholder="Ask about statistics, mechanics, hypothesis testing..." suggestedPrompts={EDEXCEL_MATHS_APPLIED_PROMPTS} />
      </div>
    </div>
  );
};
