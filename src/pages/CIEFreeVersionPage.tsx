import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { CIE_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const CIE_PRODUCT_ID = "9a710cf9-0523-4c1f-82c6-0e02b19087e5";

const DEFAULT_PROMPTS = [
  { text: "Explain the difference between demand-pull and cost-push inflation" },
  { text: "What are the characteristics of perfect competition?" },
  { text: "Help me understand the Phillips Curve" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const CIEFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(CIE_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : CIE_ECONOMICS_EXAMS;

  const sharedProps = {
    subjectName: "CIE Economics",
    productId: CIE_PRODUCT_ID,
    productSlug: "cie-economics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "economics" as const,
    customDiagramData: tc.diagram_library.length > 0 ? tc.diagram_library : undefined,
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showMockExam: true,
    mockExamBoard: "CIE",
    mockExamSubject: "Economics",
    showRevisionGuide: resolveFeature(tc, 'revision_guide', false),
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "CIE Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customPastPaperContent: <DynamicPastPaperFinder productId={CIE_PRODUCT_ID} subjectName="CIE Economics" tier="free" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={CIE_PRODUCT_ID} subjectName="CIE Economics" tier="free" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – CIE Economics A-Level Revision | Try Now" description="Try A* AI free for CIE/Cambridge Economics." canonical="https://astarai.co.uk/cie-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={CIE_PRODUCT_ID} subjectName="CIE Economics" subjectDescription="Your free CIE Economics revision assistant" footerText="A* AI can make mistakes. Verify important info." placeholder="Ask any CIE Economics question..." suggestedPrompts={prompts} enableDiagrams diagramSubject="economics" chatRef={chatRef} examDates={examDates} promptLabels={['Inflation', 'Market structure', 'Theory', 'Revision']} trainerAvatarUrl={tc.trainer_image_url || undefined} trainerName={tc.trainer_name || undefined} trainerStatus={tc.trainer_status || undefined} trainerAchievements={tc.trainer_achievements.length > 0 ? tc.trainer_achievements : undefined} trainerDescription={tc.trainer_description || undefined} useEmojiStars />
      </div>
    </div>
  );
};
