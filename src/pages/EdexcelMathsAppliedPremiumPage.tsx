import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';
import { Header } from '@/components/Header';
import { checkProductAccess } from '@/lib/productAccess';

const EDEXCEL_MATHS_APPLIED_SLUG = 'edexcel-mathematics-applied';
const EDEXCEL_MATHS_APPLIED_PROMPTS = [
  { text: "Explain Newton's second law problems" },
  { text: "How do I approach a hypothesis test?" },
  { text: "Help me with projectile motion questions" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsAppliedPremiumPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const chatRef = useRef<RAGChatRef>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setCheckingAccess(false); return; }
      try {
        // Get the Applied product ID for content isolation
        const { data: product } = await supabase.from('products').select('id').eq('slug', EDEXCEL_MATHS_APPLIED_SLUG).single();
        if (!product) { setCheckingAccess(false); return; }
        setProductId(product.id);
        // Use centralized access check which includes bundle logic (Pure grants Applied access)
        const access = await checkProductAccess(user.id, EDEXCEL_MATHS_APPLIED_SLUG);
        setHasAccess(access.hasAccess);
      } catch (e) { console.error(e); }
      finally { setCheckingAccess(false); }
    };
    if (!loading) checkAccess();
  }, [user, loading]);

  if (loading || checkingAccess) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>);
  if (!user) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Sign In Required</h1><Button variant="brand" onClick={() => navigate('/login')}>Sign In</Button></div></div></div>);
  if (!hasAccess || !productId) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><div className="flex flex-col gap-3"><Button variant="brand" onClick={() => navigate('/compare')}>View Plans</Button><Button variant="outline" onClick={() => navigate('/edexcel-maths-applied-free-version')}>Try Free Version</Button></div></div></div></div>);

  const sharedProps = {
    subjectName: "Edexcel Maths (Applied)",
    productId,
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
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – Edexcel Maths Applied | AI Tutor" description="Your personal Edexcel Mathematics Applied A* tutor." canonical="https://astarai.co.uk/edexcel-maths-applied-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={productId} subjectName="Edexcel Mathematics Applied Deluxe" subjectDescription="Your personal A* Stats & Mechanics tutor. Ask me anything!" footerText="Powered by A* AI • Edexcel Mathematics Applied (Stats & Mechanics)" placeholder="Ask me anything about Stats & Mechanics..." suggestedPrompts={EDEXCEL_MATHS_APPLIED_PROMPTS} chatRef={chatRef} />
      </div>
    </div>
  );
};
