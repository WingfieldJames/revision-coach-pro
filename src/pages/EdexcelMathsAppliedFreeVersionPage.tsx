import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { EDEXCEL_MATHS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';

const EDEXCEL_MATHS_APPLIED_PRODUCT_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const DEFAULT_PROMPTS = [
  { text: "Explain Newton's second law problems" },
  { text: "How do I approach a hypothesis test?" },
  { text: "Help me with projectile motion questions" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const EdexcelMathsAppliedFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const tc = useTrainerConfig(EDEXCEL_MATHS_APPLIED_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const handleModeChange = (mode: 'pure' | 'applied') => {
    if (mode === 'pure') {
      navigate(location.pathname.includes('premium') ? '/edexcel-maths-premium' : '/edexcel-maths-free-version');
    }
  };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : EDEXCEL_MATHS_EXAMS;

  const sharedProps = {
    subjectName: "Edexcel Maths (Applied)",
    productId: EDEXCEL_MATHS_APPLIED_PRODUCT_ID,
    productSlug: "edexcel-mathematics-applied",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showMockExam: true,
    mockExamBoard: "Edexcel",
    mockExamSubject: "Mathematics",
    pastPaperBoard: "edexcel-maths-applied" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "edexcel-maths-applied" as const,
    showGradeBoundaries: resolveFeature(tc, 'grade_boundaries', true),
    gradeBoundariesData: tc.grade_boundaries_data,
    showGraphSketcher: true,
    showStatDistribution: true,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    examDates,
    examSubjectName: "Edexcel Maths",
    showMyMistakes: resolveFeature(tc, 'my_mistakes', true),
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} subjectName="Edexcel Maths (Applied)" tier="free" />,
    customPastPaperContent: <DynamicPastPaperFinder productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} subjectName="Edexcel Maths (Applied)" tier="free" />,
    showMathsModeSwitcher: true,
    mathsMode: 'applied' as const,
    onMathsModeChange: handleModeChange,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – Edexcel Maths Applied (Stats & Mechanics) | Try Now" description="Try A* AI free for Edexcel Mathematics Applied." canonical="https://astarai.co.uk/edexcel-maths-applied-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={EDEXCEL_MATHS_APPLIED_PRODUCT_ID} subjectName="Edexcel Mathematics Applied" subjectDescription="Your personal A* Stats & Mechanics tutor. Ask me anything!" footerText="Powered by A* AI • Edexcel Mathematics Applied (Stats & Mechanics)" placeholder="Ask about statistics, mechanics, hypothesis testing..." suggestedPrompts={prompts} chatRef={chatRef} examDates={examDates} promptLabels={['Mechanics', 'Statistics', 'Past papers', 'Revision']} trainerAvatarUrl={tc.trainer_image_url || undefined} trainerName={tc.trainer_name || undefined} trainerStatus={tc.trainer_status || undefined} trainerAchievements={tc.trainer_achievements.length > 0 ? tc.trainer_achievements : undefined} trainerDescription={tc.trainer_description || undefined} useEmojiStars />
      </div>
    </div>
  );
};
