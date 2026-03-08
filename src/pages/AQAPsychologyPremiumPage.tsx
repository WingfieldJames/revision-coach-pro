import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AQA_PSYCHOLOGY_EXAMS } from '@/components/ExamCountdown';
import { Header } from '@/components/Header';

const AQA_PSYCHOLOGY_SLUG = 'aqa-psychology';
const AQA_PSYCHOLOGY_PROMPTS = [
  { text: "Explain Milgram's study on obedience" },
  { text: "Find past exam questions on attachment" },
  { text: "How do I structure a 16-mark answer?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAPsychologyPremiumPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setCheckingAccess(false); return; }
      try {
        const { data: product } = await supabase.from('products').select('id').eq('slug', AQA_PSYCHOLOGY_SLUG).single();
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
  if (!hasAccess || !productId) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><div className="flex flex-col gap-3"><Button variant="brand" onClick={() => navigate('/compare')}>View Plans</Button><Button variant="outline" onClick={() => navigate('/aqa-psychology-free-version')}>Try Free Version</Button></div></div></div></div>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – AQA Psychology | AI Tutor" description="Your personal AQA Psychology A* tutor." canonical="https://astarai.co.uk/aqa-psychology-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="AQA Psychology" productId={productId} productSlug="aqa-psychology" showMyAI showPastPaperFinder pastPaperBoard="aqa-psychology" showRevisionGuide revisionGuideBoard="aqa-psychology" showExamCountdown examDates={AQA_PSYCHOLOGY_EXAMS} examSubjectName="AQA Psychology" />
      <ChatbotToolbar subjectName="AQA Psychology" productId={productId} productSlug="aqa-psychology" showMyAI showPastPaperFinder pastPaperBoard="aqa-psychology" showRevisionGuide revisionGuideBoard="aqa-psychology" showExamCountdown examDates={AQA_PSYCHOLOGY_EXAMS} examSubjectName="AQA Psychology" />
      <div className="flex-1 relative z-10">
        <RAGChat productId={productId} subjectName="AQA Psychology Deluxe" subjectDescription="Your personal A* Psychology tutor. Ask me anything!" footerText="Powered by A* AI • Trained on AQA Psychology past papers & mark schemes" placeholder="Ask me anything about AQA Psychology A-Level..." suggestedPrompts={AQA_PSYCHOLOGY_PROMPTS} />
      </div>
    </div>
  );
};
