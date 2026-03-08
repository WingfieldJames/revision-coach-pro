import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { OCR_PHYSICS_EXAMS } from '@/components/ExamCountdown';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useTheme } from '@/contexts/ThemeContext';

const OCR_PHYSICS_PRODUCT_ID = "ecd5978d-3bf4-4b9c-993f-30b7f3a0f197";

const OCR_PHYSICS_PROMPTS = [
  { text: "Explain Newton's laws of motion" },
  { text: "What is electromagnetic induction?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRPhysicsFreeVersionPage = () => {
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – OCR Physics A-Level Revision | Try Now" description="Try A* AI free for OCR Physics." canonical="https://astarai.co.uk/ocr-physics-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="OCR Physics" productId={OCR_PHYSICS_PRODUCT_ID} productSlug="ocr-physics" showMyAI showPastPaperFinder pastPaperBoard="ocr-physics" showExamCountdown examDates={OCR_PHYSICS_EXAMS} examSubjectName="OCR Physics" />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-2"><div className="flex items-center pl-12"><Link to="/" className="flex items-center"><img src={currentLogo} alt="A* AI logo" className="h-12 sm:h-14" /></Link></div></div>
      <div className="flex-1 relative z-10">
        <RAGChat productId={OCR_PHYSICS_PRODUCT_ID} subjectName="OCR Physics" subjectDescription="Your personal A* Physics tutor. Ask me anything!" footerText="Powered by A* AI • Trained on OCR Physics specification" placeholder="Ask about mechanics, waves, electricity..." suggestedPrompts={OCR_PHYSICS_PROMPTS} />
      </div>
    </div>
  );
};
