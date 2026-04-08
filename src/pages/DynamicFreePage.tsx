import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { ExamDate } from '@/components/ExamCountdown';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProductConfig {
  id: string; name: string; slug: string; subject: string; exam_board: string; system_prompt_deluxe: string | null;
}
interface TrainerConfig {
  trainer_image_url: string | null; trainer_description: string | null; selected_features: string[] | null;
  exam_dates: any[] | null; essay_marker_marks: number[] | null;
  suggested_prompts: Array<{ text: string; usesPersonalization?: boolean }> | null;
  diagram_library: Array<{ id: string; title: string; imagePath: string }> | null;
  trainer_name: string | null; trainer_status: string | null;
  trainer_achievements: any[] | null;
}

export const DynamicFreePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const chatRef = useRef<RAGChatRef>(null);
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [trainer, setTrainer] = useState<TrainerConfig | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [hasAppliedCounterpart, setHasAppliedCounterpart] = useState(false);

  useEffect(() => {
    if (!slug) { navigate('/compare'); return; }
    const load = async () => {
      const { data: prod } = await supabase.from('products').select('id, name, slug, subject, exam_board, system_prompt_deluxe').eq('slug', slug).eq('active', true).maybeSingle();
      if (!prod) { navigate('/compare'); return; }
      setProduct(prod);
      const { data: tp } = await supabase.from('trainer_projects').select('trainer_image_url, trainer_description, selected_features, exam_dates, essay_marker_marks, qualification_type, suggested_prompts, diagram_library, trainer_name, trainer_status, trainer_achievements').eq('product_id', prod.id).maybeSingle();
      const trainerData = tp as unknown as TrainerConfig | null;
      setTrainer(trainerData);
      if (trainerData?.trainer_image_url) {
        const url = trainerData.trainer_image_url;
        if (url.startsWith('http') || url.startsWith('/')) {
          setResolvedImageUrl(url);
        } else {
          const { data: publicUrlData } = supabase.storage.from('trainer-uploads').getPublicUrl(url);
          if (publicUrlData?.publicUrl) setResolvedImageUrl(publicUrlData.publicUrl);
        }
      }
      // Check for maths applied counterpart
      const subLower = prod.subject.toLowerCase();
      if (subLower.includes('math')) {
        const isApplied = prod.slug.endsWith('-applied');
        const targetSlug = isApplied ? prod.slug.replace(/-applied$/, '') : `${prod.slug}-applied`;
        const { data: counterpart } = await supabase.from('products').select('id').eq('slug', targetSlug).eq('active', true).maybeSingle();
        setHasAppliedCounterpart(!!counterpart);
      }
      setLoading(false);
    };
    load();
  }, [slug, navigate]);

  if (loading || !product) return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>);

  const features = trainer?.selected_features || [];
  const hasFeature = (id: string) => features.includes(id);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };
  const qualType = (trainer as any)?.qualification_type || 'A-Level';
  const subjectName = `${product.exam_board} ${product.subject}`;
  const examDates: ExamDate[] = (trainer?.exam_dates || []).filter((d: any) => d.name && d.date).map((d: any) => ({ name: d.name, date: new Date(d.date), description: d.description || '' }));

  const subjectLower = product.subject.toLowerCase();
  const diagramSubject: 'economics' | 'cs' = subjectLower.includes('computer') ? 'cs' : 'economics';
  const isMathsSubject = subjectLower.includes('math');

  const isAppliedSlug = product.slug.endsWith('-applied');
  const pureSlug = isAppliedSlug ? product.slug.replace(/-applied$/, '') : product.slug;
  const appliedSlug = isAppliedSlug ? product.slug : `${product.slug}-applied`;
  const mathsMode: 'pure' | 'applied' = isAppliedSlug ? 'applied' : 'pure';
  const handleMathsModeChange = (mode: 'pure' | 'applied') => {
    if (mode === mathsMode) return;
    const targetSlug = mode === 'applied' ? appliedSlug : pureSlug;
    navigate(`/s/${targetSlug}/free`);
  };

  // Parse trainer achievements
  const achievements = (trainer?.trainer_achievements || [])
    .map((a: any) => typeof a === 'string' ? { text: a } : a)
    .filter((a: any) => a?.text?.trim());

  const sharedProps = {
    subjectName,
    productId: product.id,
    productSlug: product.slug,
    showMyAI: hasFeature('my_ai'),
    showDiagramTool: hasFeature('diagram_generator'),
    diagramSubject,
    customDiagramData: trainer?.diagram_library || undefined,
    showPastPaperFinder: hasFeature('past_papers'),
    showRevisionGuide: hasFeature('revision_guide'),
    showEssayMarker: hasFeature('essay_marker'),
    showExamCountdown: hasFeature('exam_countdown'),
    showGradeBoundaries: hasFeature('grade_boundaries'),
    showGraphSketcher: isMathsSubject,
    showStatDistribution: isMathsSubject,
    examDates,
    examSubjectName: subjectName,
    showMyMistakes: hasFeature('my_mistakes'),
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: trainer?.essay_marker_marks || undefined,
    customPastPaperContent: <DynamicPastPaperFinder productId={product.id} subjectName={product.subject} tier="free" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={product.id} subjectName={subjectName} tier="free" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={`Free A* AI – ${subjectName} ${qualType} Revision | Try Now`} description={`Try A* AI free for ${subjectName}.`} canonical={`https://astarai.co.uk/${product.slug}-free-version`} />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat
          productId={product.id} subjectName={subjectName}
          subjectDescription={`Your personal A* ${qualType} ${product.subject} tutor. Ask me anything!`}
          footerText={`Powered by A* AI • Trained on ${subjectName} ${qualType} specification`}
          placeholder={`Ask about ${product.subject}...`}
          examDates={examDates}
          suggestedPrompts={(() => { const filtered = (trainer?.suggested_prompts || []).filter(p => p.text?.trim()); return filtered.length > 0 ? filtered : [{ text: `What topics are in the ${product.exam_board} ${product.subject} spec?` }, { text: "How do I structure a long answer question?" }, { text: "Find past exam questions" }, { text: "Create me a full revision plan", usesPersonalization: true }]; })()}
          trainerAvatarUrl={resolvedImageUrl}
          trainerName={trainer?.trainer_name || undefined}
          trainerStatus={trainer?.trainer_status || undefined}
          trainerAchievements={achievements.length > 0 ? achievements : undefined}
          trainerDescription={trainer?.trainer_description || undefined}
          useEmojiStars
          productSlug={product.slug}
        />
      </div>
    </div>
  );
};
