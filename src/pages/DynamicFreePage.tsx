import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProductConfig {
  id: string;
  name: string;
  slug: string;
  subject: string;
  exam_board: string;
  system_prompt_deluxe: string | null;
}

interface TrainerConfig {
  trainer_image_url: string | null;
  trainer_description: string | null;
  selected_features: string[] | null;
}

export const DynamicFreePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const chatRef = useRef<RAGChatRef>(null);
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [trainer, setTrainer] = useState<TrainerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { navigate('/compare'); return; }
    const load = async () => {
      const { data: prod } = await supabase
        .from('products')
        .select('id, name, slug, subject, exam_board, system_prompt_deluxe')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();
      if (!prod) { navigate('/compare'); return; }
      setProduct(prod);

      // Load trainer config
      const { data: tp } = await supabase
        .from('trainer_projects')
        .select('trainer_image_url, trainer_description, selected_features')
        .eq('product_id', prod.id)
        .maybeSingle();
      setTrainer(tp as TrainerConfig | null);
      setLoading(false);
    };
    load();
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const features = trainer?.selected_features || [];
  const hasFeature = (id: string) => features.includes(id);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  const subjectName = `${product.exam_board} ${product.subject}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={`Free A* AI – ${subjectName} A-Level Revision | Try Now`}
        description={`Try A* AI free for ${subjectName}. AI trained on the ${product.exam_board} ${product.subject} specification.`}
        canonical={`https://astarai.co.uk/${product.slug}-free-version`}
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool={hasFeature('my_ai')}
          showDiagramTool={hasFeature('diagram_generator')}
          showEssayMarker={hasFeature('essay_marker')}
          showPastPaperFinder={hasFeature('past_papers')}
          showRevisionGuide={hasFeature('revision_guide')}
          showExamCountdown={hasFeature('exam_countdown')}
          examSubjectName={subjectName}
          hideUserDetails
          productId={product.id}
          productSlug={product.slug}
          showUpgradeButton
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>

      <div className="flex-1 relative z-10">
        <RAGChat
          productId={product.id}
          subjectName={subjectName}
          subjectDescription={`Your personal A* ${product.subject} tutor. Ask me anything!`}
          footerText={`Powered by A* AI • Trained on ${subjectName} specification`}
          placeholder={`Ask about ${product.subject}...`}
          suggestedPrompts={[
            { text: `What topics are in the ${product.exam_board} ${product.subject} spec?` },
            { text: "How do I structure a long answer question?" },
            { text: "Create me a full revision plan", usesPersonalization: true },
          ]}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
