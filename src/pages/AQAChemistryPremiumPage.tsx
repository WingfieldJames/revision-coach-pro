import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AQA_CHEMISTRY_EXAMS } from '@/components/ExamCountdown';

// AQA Chemistry product slug
const AQA_CHEMISTRY_SLUG = 'aqa-chemistry';

const AQA_CHEMISTRY_PROMPTS = [
  { text: "Explain the mechanism of electrophilic addition" },
  { text: "Find past exam questions on equilibria" },
  { text: "How do I structure a 6-mark answer?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAChemistryPremiumPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const chatRef = useRef<RAGChatRef>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      try {
        // Get product ID for AQA Chemistry
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', AQA_CHEMISTRY_SLUG)
          .single();

        if (productError || !product) {
          console.error('Product not found:', productError);
          setCheckingAccess(false);
          return;
        }

        setProductId(product.id);

        // Check if user has active subscription
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('active', true)
          .maybeSingle();

        if (subError) {
          console.error('Subscription check error:', subError);
        }

        setHasAccess(!!subscription);
      } catch (error) {
        console.error('Access check error:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading]);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  // Loading state
  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead 
          title="Deluxe A* AI – AQA Chemistry | Premium Access Required"
          description="Sign in to access your AQA Chemistry Deluxe subscription."
          canonical="https://astarai.co.uk/aqa-chemistry-premium"
        />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access AQA Chemistry Deluxe.
            </p>
            <Button variant="brand" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No access
  if (!hasAccess || !productId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead 
          title="Deluxe A* AI – AQA Chemistry | Premium Access Required"
          description="Upgrade to access AQA Chemistry Deluxe with AI trained on past papers."
          canonical="https://astarai.co.uk/aqa-chemistry-premium"
        />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
            <p className="text-muted-foreground mb-6">
              Upgrade to AQA Chemistry Deluxe for unlimited AI tutoring with full past paper training.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="brand" onClick={() => navigate('/compare')}>
                View Plans
              </Button>
              <Button variant="outline" onClick={() => navigate('/aqa-chemistry-free-version')}>
                Try Free Version
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has access - show the RAG chat
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – AQA Chemistry | AI Tutor"
        description="Your personal AQA Chemistry A* tutor. AI trained on past papers, mark schemes, and specifications."
        canonical="https://astarai.co.uk/aqa-chemistry-premium"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={AQA_CHEMISTRY_EXAMS}
          examSubjectName="AQA Chemistry"
          hideUserDetails 
          productId={productId}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
          essayMarkerLabel="6-Marker Analysis"
          essayMarkerFixedMark={6}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={productId}
          subjectName="AQA Chemistry Deluxe"
          subjectDescription="Your personal A* Chemistry tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on AQA Chemistry past papers & mark schemes"
          placeholder="Ask me anything about AQA Chemistry A-Level..."
          suggestedPrompts={AQA_CHEMISTRY_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
