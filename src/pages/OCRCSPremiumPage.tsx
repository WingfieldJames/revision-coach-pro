import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { OCR_CS_EXAMS } from '@/components/ExamCountdown';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

const OCR_CS_PRODUCT_ID = "5d05830b-de7b-4206-8f49-6d3695324eb6";

const OCR_CS_PROMPTS = [
  { text: "Explain binary search algorithm" },
  { text: "What are the different data types?" },
  { text: "How do I structure a long answer question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRCSPremiumPage = () => {
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – OCR Computer Science | Full Past Paper Training" description="Access A* AI Deluxe for OCR Computer Science." canonical="https://astarai.co.uk/ocr-cs-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="OCR Computer Science" productId={OCR_CS_PRODUCT_ID} productSlug="ocr-computer-science" showMyAI showPastPaperFinder pastPaperBoard="ocr-cs" showRevisionGuide revisionGuideBoard="ocr-cs" showDiagramTool diagramSubject="cs" showExamCountdown examDates={OCR_CS_EXAMS} examSubjectName="OCR Computer Science" showMyMistakes />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-2"><div className="flex items-center pl-12"><Link to="/" className="flex items-center"><img src={currentLogo} alt="A* AI logo" className="h-12 sm:h-14" /></Link></div></div>
      <div className="flex-1 relative z-10">
        <RAGChat productId={OCR_CS_PRODUCT_ID} subjectName="OCR Computer Science Deluxe" subjectDescription="Your personal A* Computer Science tutor with full diagram access. Ask me anything!" footerText="Powered by A* AI • Trained on OCR Computer Science specification (2017-2025)" placeholder="Ask about algorithms, data structures, programming..." suggestedPrompts={OCR_CS_PROMPTS} enableDiagrams diagramSubject="cs" />
      </div>
    </div>
  );
};
