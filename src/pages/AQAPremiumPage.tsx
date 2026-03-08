import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { checkProductAccess } from '@/lib/productAccess';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const AQA_PRODUCT_ID = "17ade690-8c44-4961-83b5-0edf42a9faea";

const AQA_ECONOMICS_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAPremiumPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const chatRef = useRef<RAGChatRef>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        if (!user) { navigate('/login?redirect=aqa-premium'); return; }
        try {
          const access = await checkProductAccess(user.id, 'aqa-economics');
          if (!access.hasAccess || access.tier !== 'deluxe') { navigate('/compare'); return; }
          setHasAccess(true); setCheckingAccess(false);
        } catch { navigate('/compare'); }
      }
    };
    verifyAccess();
  }, [user, loading, navigate]);

  if (loading || checkingAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading...</p></div></div>);
  }
  if (!user || !hasAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><p className="text-muted-foreground mb-6">You need a premium subscription.</p><Button variant="brand" onClick={() => navigate('/compare')}>Upgrade to Premium</Button></div></div>);
  }

  const sharedProps = {
    subjectName: "AQA Economics",
    productId: AQA_PRODUCT_ID,
    productSlug: "aqa-economics",
    showMyAI: true,
    showPastPaperFinder: true,
    pastPaperBoard: "aqa" as const,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: AQA_ECONOMICS_EXAMS,
    examSubjectName: "AQA Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – AQA Economics | Full Past Paper Training" description="Access A* AI Deluxe for AQA Economics." canonical="https://astarai.co.uk/aqa-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_PRODUCT_ID} subjectName="AQA Economics" subjectDescription="Your personal A* Economics tutor. Ask me anything about AQA A-Level Economics!" footerText="Powered by A* AI • Trained on AQA Economics specification" placeholder="Ask about microeconomics, macroeconomics, diagrams, exam technique..." suggestedPrompts={AQA_ECONOMICS_PROMPTS} enableDiagrams diagramSubject="economics" chatRef={chatRef} />
      </div>
    </div>
  );
};
