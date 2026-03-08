import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { ExamDate } from '@/components/ExamCountdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkProductAccess } from '@/lib/productAccess';
import { Loader2 } from 'lucide-react';

interface ProductConfig {
  id: string; name: string; slug: string; subject: string; exam_board: string; system_prompt_deluxe: string | null;
}
interface TrainerConfig {
  trainer_image_url: string | null; trainer_description: string | null; selected_features: string[] | null;
  exam_dates: any[] | null; essay_marker_marks: number[] | null;
  suggested_prompts: Array<{ text: string; usesPersonalization?: boolean }> | null;
  diagram_library: Array<{ id: string; title: string; imagePath: string }> | null;
}

export const DynamicPremiumPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const chatRef = useRef<RAGChatRef>(null);
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [trainer, setTrainer] = useState<TrainerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!slug) { navigate('/compare'); return; }
    const load = async () => {
      const { data: prod } = await supabase.from('products').select('id, name, slug, subject, exam_board, system_prompt_deluxe').eq('slug', slug).eq('active', true).maybeSingle();
      if (!prod) { navigate('/compare'); return; }
      if (!user) { navigate(`/login?redirect=${prod.slug}-premium`); return; }
      const access = await checkProductAccess(user.id, prod.slug);
      if (!access.hasAccess) { navigate('/compare'); return; }
      setProduct(prod);
      const { data: tp } = await supabase.from('trainer_projects').select('trainer_image_url, trainer_description, selected_features, exam_dates, essay_marker_marks, qualification_type, suggested_prompts, diagram_library').eq('product_id', prod.id).maybeSingle();
      setTrainer(tp as unknown as TrainerConfig | null);
      setLoading(false);
    };
    load();
  }, [slug, navigate, user, authLoading]);

  if (loading || !product) return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>);

  const features = trainer?.selected_features || [];
  const hasFeature = (id: string) => features.includes(id);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };
  const qualType = (trainer as any)?.qualification_type || 'A-Level';
  const subjectName = `${product.exam_board} ${product.subject}`;
  const examDates: ExamDate[] = (trainer?.exam_dates || []).filter((d: any) => d.name && d.date).map((d: any) => ({ name: d.name, date: new Date(d.date), description: d.description || '' }));

  const sharedProps = {
    subjectName,
    productId: product.id,
    productSlug: product.slug,
    showMyAI: hasFeature('my_ai'),
    showPastPaperFinder: hasFeature('past_papers'),
    showRevisionGuide: hasFeature('revision_guide'),
    showExamCountdown: hasFeature('exam_countdown'),
    examDates,
    examSubjectName: subjectName,
    showMyMistakes: hasFeature('my_mistakes'),
    customPastPaperContent: <DynamicPastPaperFinder productId={product.id} subjectName={product.subject} tier="deluxe" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={product.id} subjectName={subjectName} tier="deluxe" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={`Deluxe A* AI – ${subjectName} ${qualType} | Full Training`} description={`Access A* AI Deluxe for ${subjectName} ${qualType}.`} canonical={`https://astarai.co.uk/${product.slug}-premium`} />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat
          productId={product.id} subjectName={`${subjectName} Deluxe`}
          subjectDescription={`Your personal A* ${qualType} ${product.subject} tutor with full access. Ask me anything!`}
          footerText={`Powered by A* AI • Trained on ${subjectName} ${qualType} specification`}
          placeholder={`Ask about ${product.subject}...`}
          suggestedPrompts={(() => { const filtered = (trainer?.suggested_prompts || []).filter(p => p.text?.trim()); return filtered.length > 0 ? filtered : [{ text: `What topics are in the ${product.exam_board} ${product.subject} spec?` }, { text: "How do I structure a long answer question?" }, { text: "Create me a full revision plan", usesPersonalization: true }]; })()}
        />
      </div>
    </div>
  );
};
