import { useRef, useEffect, useState } from 'react';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { ExamDate } from '@/components/ExamCountdown';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTopGradeLabel } from '@/lib/qualification';
import { Loader2, AlertTriangle, School as SchoolIcon } from 'lucide-react';
import type { School } from '@/hooks/useSchoolMembership';

const SCHOOL_PRODUCT_SLUG = 'edexcel-economics';

interface ProductConfig {
  id: string; name: string; slug: string; subject: string; exam_board: string; system_prompt_deluxe: string | null;
}
interface TrainerConfig {
  trainer_image_url: string | null; trainer_description: string | null; selected_features: string[] | null;
  exam_dates: unknown[] | null; essay_marker_marks: number[] | null; qualification_type: string | null;
  suggested_prompts: Array<{ text: string; usesPersonalization?: boolean }> | null;
  diagram_library: Array<{ id: string; title: string; imagePath: string }> | null;
  trainer_name: string | null; trainer_status: string | null;
  trainer_achievements: unknown[] | null;
  grade_boundaries_data: Record<string, Record<string, number>> | null;
}

interface UsageState {
  count: number;
  cap: number | null;
}

interface StudentCoachProps {
  school: School;
}

export const StudentCoach = ({ school }: StudentCoachProps) => {
  const { user } = useAuth();
  const chatRef = useRef<RAGChatRef>(null);
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [trainer, setTrainer] = useState<TrainerConfig | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(undefined);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: prod } = await supabase
        .from('products')
        .select('id, name, slug, subject, exam_board, system_prompt_deluxe')
        .eq('slug', SCHOOL_PRODUCT_SLUG)
        .eq('active', true)
        .maybeSingle();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      const { data: tp } = await supabase
        .from('trainer_projects')
        .select('trainer_image_url, trainer_description, selected_features, exam_dates, essay_marker_marks, qualification_type, suggested_prompts, diagram_library, trainer_name, trainer_status, trainer_achievements, grade_boundaries_data')
        .eq('product_id', prod.id)
        .maybeSingle();
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

      // Resolve today's usage + the student's class cap (server enforces; this is display only)
      if (user) {
        const today = new Date().toISOString().slice(0, 10);
        const { data: usageRow } = await supabase
          .from('daily_prompt_usage')
          .select('prompt_count')
          .eq('user_id', user.id)
          .eq('product_id', prod.id)
          .eq('usage_date', today)
          .maybeSingle();

        // Find the student's class within this school, then its daily cap
        let cap: number | null = null;
        const { data: memberships } = await supabase
          .from('class_members')
          .select('class_id, classes!inner(id, school_id)')
          .eq('user_id', user.id)
          .eq('classes.school_id', school.id);
        const classId = memberships?.[0]?.class_id;
        if (classId) {
          const { data: settings } = await supabase
            .from('class_ai_settings')
            .select('daily_cap')
            .eq('class_id', classId)
            .maybeSingle();
          cap = settings?.daily_cap ?? null;
        }

        setUsage({ count: usageRow?.prompt_count ?? 0, cap });
      }

      setLoading(false);
    };
    load();
  }, [user, school.id]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const accent = school.primary_color || undefined;
  const features = trainer?.selected_features || [];
  const hasFeature = (id: string) => features.includes(id);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };
  const qualType = trainer?.qualification_type || 'A-Level';
  const isGCSE = qualType === 'GCSE';
  const topGrade = getTopGradeLabel(isGCSE ? 'gcse' : 'alevel');
  const subjectName = `${product.exam_board} ${product.subject}`;
  const examDates: ExamDate[] = (trainer?.exam_dates || [])
    .map((d) => d as { name?: string; date?: string; description?: string })
    .filter((d) => d.name && d.date)
    .map((d) => ({ name: d.name as string, date: new Date(d.date as string), description: d.description || '' }));

  const subjectLower = product.subject.toLowerCase();
  const diagramSubject: 'economics' | 'cs' = subjectLower.includes('computer') ? 'cs' : 'economics';

  const achievements = (trainer?.trainer_achievements || [])
    .map((a) => (typeof a === 'string' ? { text: a } : (a as { text?: string })))
    .filter((a) => a?.text?.trim()) as Array<{ text: string }>;

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
    gradeBoundariesData: trainer?.grade_boundaries_data || null,
    isGCSE,
    examDates,
    examSubjectName: subjectName,
    showMyMistakes: hasFeature('my_mistakes'),
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: trainer?.essay_marker_marks || undefined,
    showMockExam: true,
    mockExamBoard: product.exam_board,
    mockExamSubject: product.subject,
    customPastPaperContent: <DynamicPastPaperFinder productId={product.id} subjectName={product.subject} tier="deluxe" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={product.id} subjectName={subjectName} tier="deluxe" />,
  };

  const usagePct = usage?.cap ? Math.min(100, Math.round((usage.count / usage.cap) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Branded school header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          {school.logo_url ? (
            <img src={school.logo_url} alt={`${school.name} logo`} className="h-8 w-8 rounded-md object-contain" />
          ) : (
            <div
              className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center"
              style={accent ? { backgroundColor: `${accent}1a` } : undefined}
            >
              <SchoolIcon className="h-4 w-4 text-primary" style={accent ? { color: accent } : undefined} />
            </div>
          )}
          <span className="text-sm font-bold" style={accent ? { color: accent } : undefined}>{school.name}</span>
        </div>

        {/* Usage meter */}
        {usage && (
          <div className="flex items-center gap-2 min-w-[140px]">
            {usage.cap ? (
              <>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {usage.count} / {usage.cap} prompts
                </span>
                <Progress value={usagePct} className="h-1.5 w-20" />
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {usage.count} prompts today
              </span>
            )}
          </div>
        )}
      </header>

      {/* Persistent, non-dismissable AI disclosure (EU AI Act Art. 50) */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 sm:px-6 py-2 flex items-center gap-2 relative z-20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-snug">
          You&apos;re interacting with an AI. It won&apos;t give you answers — it helps you work them out.
        </p>
      </div>

      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat
          chatRef={chatRef}
          productId={product.id}
          subjectName={subjectName}
          subjectDescription={`Your ${topGrade} ${qualType} ${product.subject} coach. Ask me anything!`}
          footerText={`Powered by A* AI • ${school.name}`}
          placeholder={`Ask about ${product.subject}...`}
          examDates={examDates}
          suggestedPrompts={(() => {
            const filtered = (trainer?.suggested_prompts || []).filter(p => p.text?.trim());
            return filtered.length > 0 ? filtered : [
              { text: `What topics are in the ${product.exam_board} ${product.subject} spec?` },
              { text: 'How do I structure a long answer question?' },
              { text: 'Find past exam questions' },
              { text: 'Create me a full revision plan', usesPersonalization: true },
            ];
          })()}
          trainerAvatarUrl={resolvedImageUrl}
          trainerName={trainer?.trainer_name || undefined}
          trainerStatus={trainer?.trainer_status || undefined}
          trainerAchievements={achievements.length > 0 ? achievements : undefined}
          trainerDescription={trainer?.trainer_description || undefined}
          useEmojiStars
          productSlug={product.slug}
          isGCSE={isGCSE}
        />
      </div>
    </div>
  );
};
