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
import { AQA_CHEMISTRY_EXAMS } from '@/components/ExamCountdown';
import { Header } from '@/components/Header';

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
  const chatRef = useRef<RAGChatRef>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setCheckingAccess(false); return; }
      try {
        const { data: product } = await supabase.from('products').select('id').eq('slug', AQA_CHEMISTRY_SLUG).single();
        if (!product) { setCheckingAccess(false); return; }
        setProductId(product.id);
        const { data: subscription } = await supabase.from('user_subscriptions').select('*').eq('user_id', user.id).eq('product_id', product.id).eq('active', true).maybeSingle();
        setHasAccess(!!subscription);
      } catch (e) { console.error(e); }
      finally { setCheckingAccess(false); }
    };
    if (!loading) checkAccess();
  }, [user, loading]);

  if (loading || checkingAccess) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>);
  if (!user) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Sign In Required</h1><Button variant="brand" onClick={() => navigate('/login')}>Sign In</Button></div></div></div>);
  if (!hasAccess || !productId) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><div className="flex flex-col gap-3"><Button variant="brand" onClick={() => navigate('/compare')}>View Plans</Button><Button variant="outline" onClick={() => navigate('/aqa-chemistry-free-version')}>Try Free Version</Button></div></div></div></div>);

  const sharedProps = {
    subjectName: "AQA Chemistry",
    productId,
    productSlug: "aqa-chemistry",
    showMyAI: true,
    showPastPaperFinder: true,
    showEssayMarker: true,
    showExamCountdown: true,
    examDates: AQA_CHEMISTRY_EXAMS,
    examSubjectName: "AQA Chemistry",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – AQA Chemistry | AI Tutor" description="Your personal AQA Chemistry A* tutor." canonical="https://astarai.co.uk/aqa-chemistry-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={productId} subjectName="AQA Chemistry Deluxe" subjectDescription="Your personal A* Chemistry tutor. Ask me anything!" footerText="Powered by A* AI • Trained on AQA Chemistry past papers & mark schemes" placeholder="Ask me anything about AQA Chemistry A-Level..." suggestedPrompts={AQA_CHEMISTRY_PROMPTS} chatRef={chatRef} />
      </div>
    </div>
  );
};
