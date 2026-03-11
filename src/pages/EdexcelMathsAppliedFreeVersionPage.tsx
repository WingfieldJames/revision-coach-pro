import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_MATHS_APPLIED_PRODUCT_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const EDEXCEL_MATHS_APPLIED_PROMPTS = [
  { text: "Explain Newton's second law problems" },
  { text: "How do I approach a hypothesis test?" },
  { text: "Help me with projectile motion questions" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsAppliedFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const handleModeChange = (mode: 'pure' | 'applied') => {
    if (mode === 'pure') {
      navigate(location.pathname.includes('premium') ? '/edexcel-maths-premium' : '/edexcel-maths-free-version');
    }
  };

  const sharedProps = {
    subjectName: "Edexcel Maths (Applied)",
    productId: EDEXCEL_MATHS_APPLIED_PRODUCT_ID,
    productSlug: "edexcel-mathematics-applied",
    showMyAI: true,
    showPastPaperFinder: true,
    pastPaperBoard: "edexcel-maths-applied" as const,
    showRevisionGuide: true,
    revisionGuideBoard: "edexcel-maths-applied" as const,
    showGradeBoundaries: true,
    gradeBoundariesSubject: "maths" as const,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: EDEXCEL_MATHS_EXAMS,
    examSubjectName: "Edexcel Maths",
    showMyMistakes: true,
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    showMathsModeSwitcher: true,
    mathsMode: 'applied' as const,
    onMathsModeChange: handleModeChange,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – Edexcel Maths Applied (Stats & Mechanics) | Try Now" description="Try A* AI free for Edexcel Mathematics Applied." canonical="https://astarai.co.uk/edexcel-maths-applied-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} subjectName="Edexcel Mathematics Applied" subjectDescription="Your personal A* Stats & Mechanics tutor. Ask me anything!" footerText="Powered by A* AI • Edexcel Mathematics Applied (Stats & Mechanics)" placeholder="Ask about statistics, mechanics, hypothesis testing..." suggestedPrompts={EDEXCEL_MATHS_APPLIED_PROMPTS} chatRef={chatRef} />
      </div>
    </div>
  );
};
