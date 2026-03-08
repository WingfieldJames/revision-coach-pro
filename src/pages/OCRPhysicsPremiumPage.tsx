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
import { OCR_PHYSICS_EXAMS } from '@/components/ExamCountdown';
import { Header } from '@/components/Header';

const OCR_PHYSICS_SLUG = 'ocr-physics';
const OCR_PHYSICS_PROMPTS = [
  { text: "Explain the photoelectric effect" },
  { text: "Find past exam questions on waves" },
  { text: "How do I structure a 6-mark answer?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRPhysicsPremiumPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [productId, setProductId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { setCheckingAccess(false); return; }
      try {
        const { data: product } = await supabase.from('products').select('id').eq('slug', OCR_PHYSICS_SLUG).single();
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
  if (!hasAccess || !productId) return (<div className="min-h-screen bg-background flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><div className="text-center max-w-md px-6"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><div className="flex flex-col gap-3"><Button variant="brand" onClick={() => navigate('/compare')}>View Plans</Button><Button variant="outline" onClick={() => navigate('/ocr-physics-free-version')}>Try Free Version</Button></div></div></div></div>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – OCR Physics | AI Tutor" description="Your personal OCR Physics A* tutor." canonical="https://astarai.co.uk/ocr-physics-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar subjectName="OCR Physics" productId={productId} productSlug="ocr-physics" showMyAI showPastPaperFinder pastPaperBoard="ocr-physics" showExamCountdown examDates={OCR_PHYSICS_EXAMS} examSubjectName="OCR Physics" />
      <ChatbotToolbar subjectName="OCR Physics" productId={productId} productSlug="ocr-physics" showMyAI showPastPaperFinder pastPaperBoard="ocr-physics" showExamCountdown examDates={OCR_PHYSICS_EXAMS} examSubjectName="OCR Physics" />
      <div className="flex-1 relative z-10">
        <RAGChat productId={productId} subjectName="OCR Physics Deluxe" subjectDescription="Your personal A* Physics tutor. Ask me anything!" footerText="Powered by A* AI • Trained on OCR Physics past papers & mark schemes" placeholder="Ask me anything about OCR Physics A-Level..." suggestedPrompts={OCR_PHYSICS_PROMPTS} />
      </div>
    </div>
  );
};
