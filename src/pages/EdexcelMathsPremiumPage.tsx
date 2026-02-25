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
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';

const EDEXCEL_MATHS_SLUG = 'edexcel-mathematics';

const EDEXCEL_MATHS_PROMPTS = [
  { text: "Explain integration by parts" },
  { text: "How do I approach a proof question?" },
  { text: "Find past exam questions on differentiation" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsPremiumPage = () => {
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
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', EDEXCEL_MATHS_SLUG)
          .single();

        if (productError || !product) {
          console.error('Product not found:', productError);
          setCheckingAccess(false);
          return;
        }

        setProductId(product.id);

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

  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => {
    chatRef.current?.submitMessage(message, imageDataUrl);
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead 
          title="Deluxe A* AI – Edexcel Mathematics | Premium Access Required"
          description="Sign in to access your Edexcel Mathematics Deluxe subscription."
          canonical="https://astarai.co.uk/edexcel-maths-premium"
        />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access Edexcel Mathematics Deluxe.
            </p>
            <Button variant="brand" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess || !productId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead 
          title="Deluxe A* AI – Edexcel Mathematics | Premium Access Required"
          description="Upgrade to access Edexcel Mathematics Deluxe with AI trained on past papers."
          canonical="https://astarai.co.uk/edexcel-maths-premium"
        />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
            <p className="text-muted-foreground mb-6">
              Upgrade to Edexcel Mathematics Deluxe for unlimited AI tutoring with full past paper training.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="brand" onClick={() => navigate('/compare')}>
                View Plans
              </Button>
              <Button variant="outline" onClick={() => navigate('/edexcel-maths-free-version')}>
                Try Free Version
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – Edexcel Mathematics | AI Tutor"
        description="Your personal Edexcel Mathematics A* tutor. AI trained on past papers, mark schemes, and specifications."
        canonical="https://astarai.co.uk/edexcel-maths-premium"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool
          showPastPaperFinder
          pastPaperBoard="edexcel-maths"
          showRevisionGuide
          revisionGuideBoard="edexcel-maths"
          showGradeBoundaries
          gradeBoundariesSubject="maths"
          showExamCountdown
          examDates={EDEXCEL_MATHS_EXAMS}
          examSubjectName="Edexcel Maths"
          hideUserDetails 
          productId={productId}
          productSlug="edexcel-mathematics"
          showUpgradeButton
          mathsMode="pure"
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={productId}
          subjectName="Edexcel Mathematics Deluxe"
          subjectDescription="Your personal A* Maths tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on Edexcel Mathematics past papers & mark schemes"
          placeholder="Ask me anything about Edexcel A-Level Maths..."
          suggestedPrompts={EDEXCEL_MATHS_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
