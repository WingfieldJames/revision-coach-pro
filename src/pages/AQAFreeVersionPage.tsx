import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';

const AQA_PRODUCT_ID = "17ade690-8c44-4961-83b5-0edf42a9faea";

const DEFAULT_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(AQA_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : AQA_ECONOMICS_EXAMS;

  const sharedProps = {
    subjectName: "AQA Economics",
    productId: AQA_PRODUCT_ID,
    productSlug: "aqa-economics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "economics" as const,
    customDiagramData: tc.diagram_library.length > 0 ? tc.diagram_library : undefined,
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showMockExam: true,
    mockExamBoard: "AQA",
    mockExamSubject: "Economics",
    pastPaperBoard: "aqa" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', false),
    revisionGuideBoard: "aqa" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "AQA Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={AQA_PRODUCT_ID} subjectName="AQA Economics" tier="free" />,
    customPastPaperContent: <DynamicPastPaperFinder productId={AQA_PRODUCT_ID} subjectName="AQA Economics" tier="free" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – AQA Economics A-Level Revision | Try Now" description="Try A* AI free for AQA Economics." canonical="https://astarai.co.uk/aqa-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_PRODUCT_ID} subjectName="AQA Economics" subjectDescription="Your free AQA Economics revision assistant" footerText="A* AI can make mistakes. Verify important info." placeholder="Ask any AQA Economics question..." suggestedPrompts={prompts} enableDiagrams diagramSubject="economics" chatRef={chatRef} examDates={examDates} promptLabels={['Spec point', 'Past papers', 'Exam structure', 'Revision']} trainerAvatarUrl={tc.trainer_image_url || undefined} trainerName={tc.trainer_name || undefined} trainerStatus={tc.trainer_status || undefined} trainerAchievements={tc.trainer_achievements.length > 0 ? tc.trainer_achievements : undefined} trainerDescription={tc.trainer_description || undefined} useEmojiStars productSlug="aqa-economics" />
      </div>
    </div>
  );
};
