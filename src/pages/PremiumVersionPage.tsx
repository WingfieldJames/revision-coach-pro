import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { checkProductAccess } from '@/lib/productAccess';
import { EDEXCEL_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_PRODUCT_ID = "6dc19d53-8a88-4741-9528-f25af97afb21";

const EDEXCEL_ECONOMICS_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const PremiumVersionPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const chatRef = useRef<RAGChatRef>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        if (!user) {
          navigate('/login?redirect=premium');
          return;
        }
        
        try {
          const access = await checkProductAccess(user.id, 'edexcel-economics');
          if (!access.hasAccess || access.tier !== 'deluxe') {
            navigate('/compare');
            return;
          }
          
          setHasAccess(true);
          setCheckingAccess(false);
        } catch (err) {
          console.error('Error verifying access:', err);
          navigate('/compare');
        }
      }
    };
    
    verifyAccess();
  }, [user, loading, navigate]);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  if (loading || checkingAccess) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You need a premium subscription to access this content.
          </p>
          <Button variant="brand" onClick={() => navigate('/compare')}>
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – Edexcel Economics | Full Past Paper Training"
        description="Access A* AI Deluxe for Edexcel Economics. Full training on 2017-2025 past papers, mark schemes, A* technique & unlimited prompts."
        canonical="https://astarai.co.uk/premium"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showPastPaperFinder
          showExamCountdown
          examDates={EDEXCEL_ECONOMICS_EXAMS}
          examSubjectName="Edexcel Economics"
          hideUserDetails 
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_PRODUCT_ID}
          subjectName="Edexcel Economics"
          subjectDescription="Your personal A* Economics tutor. Ask me anything about Edexcel A-Level Economics!"
          footerText="Powered by A* AI • Trained on Edexcel Economics specification"
          placeholder="Ask about microeconomics, macroeconomics, diagrams, exam technique..."
          suggestedPrompts={EDEXCEL_ECONOMICS_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
