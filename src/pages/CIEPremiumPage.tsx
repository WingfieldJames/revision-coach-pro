import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { CIE_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useAuth } from '@/contexts/AuthContext';
import { checkProductAccess } from '@/lib/productAccess';

const CIE_PRODUCT_ID = "9a710cf9-0523-4c1f-82c6-0e02b19087e5";

const CIE_ECONOMICS_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const CIEPremiumPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return;
      if (!user) {
        navigate('/login?redirect=cie-premium');
        return;
      }
      const access = await checkProductAccess(user.id, 'cie-economics');
      if (!access.hasAccess) {
        navigate('/compare');
      }
    };
    checkAccess();
  }, [user, loading, navigate]);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – CIE Economics | Full Past Paper Training"
        description="Access A* AI Deluxe for CIE/Cambridge Economics. Full training on past papers, mark schemes, A* technique & unlimited prompts."
        canonical="https://astarai.co.uk/cie-premium"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={CIE_ECONOMICS_EXAMS}
          examSubjectName="CIE Economics"
          hideUserDetails 
          productId={CIE_PRODUCT_ID}
          productSlug="cie-economics"
          showUpgradeButton
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={CIE_PRODUCT_ID}
          subjectName="CIE Economics Deluxe"
          subjectDescription="Your personal A* CIE Economics tutor with full past paper access. Ask me anything!"
          footerText="Powered by A* AI • Trained on CIE Economics specification"
          placeholder="Ask any CIE Economics question..."
          suggestedPrompts={CIE_ECONOMICS_PROMPTS}
          enableDiagrams
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
