import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RAGChat } from '@/components/RAGChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// OCR Physics product ID - we'll fetch this dynamically
const OCR_PHYSICS_SLUG = 'ocr-physics';

export const OCRPhysicsPremiumPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      try {
        // Get product ID for OCR Physics
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', OCR_PHYSICS_SLUG)
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

  // Loading state
  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header showNavLinks />
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
          title="Deluxe A* AI – OCR Physics | Premium Access Required"
          description="Sign in to access your OCR Physics Deluxe subscription."
          canonical="https://astarai.co.uk/ocr-physics-premium"
        />
        <Header showNavLinks />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access OCR Physics Deluxe.
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
          title="Deluxe A* AI – OCR Physics | Premium Access Required"
          description="Upgrade to access OCR Physics Deluxe with AI trained on past papers."
          canonical="https://astarai.co.uk/ocr-physics-premium"
        />
        <Header showNavLinks />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
            <p className="text-muted-foreground mb-6">
              Upgrade to OCR Physics Deluxe for unlimited AI tutoring with full past paper training.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="brand" onClick={() => navigate('/compare')}>
                View Plans
              </Button>
              <Button variant="outline" onClick={() => navigate('/ocr-physics-free-version')}>
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
        title="Deluxe A* AI – OCR Physics | AI Tutor"
        description="Your personal OCR Physics A* tutor. AI trained on past papers, mark schemes, and specifications."
        canonical="https://astarai.co.uk/ocr-physics-premium"
      />
      <Header showNavLinks hideUserDetails />
      
      <div className="flex-1">
        <RAGChat 
          productId={productId}
          subjectName="OCR Physics Deluxe"
          subjectDescription="Your personal A* Physics tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Physics past papers & mark schemes"
          placeholder="Ask me anything about OCR Physics A-Level..."
        />
      </div>
    </div>
  );
};
