import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { OCR_PHYSICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';

const OCR_PHYSICS_PRODUCT_ID = "ecd5978d-3bf4-4b9c-993f-30b7f3a0f197";

const DEFAULT_PROMPTS = [
  { text: "Explain Newton's laws of motion" },
  { text: "What is electromagnetic induction?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRPhysicsFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(OCR_PHYSICS_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : OCR_PHYSICS_EXAMS;

  const sharedProps = {
    subjectName: "OCR Physics",
    productId: OCR_PHYSICS_PRODUCT_ID,
    productSlug: "ocr-physics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', false),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    pastPaperBoard: "ocr-physics" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', false),
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "OCR Physics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={OCR_PHYSICS_PRODUCT_ID} subjectName="OCR Physics" tier="free" />,
    customPastPaperContent: <DynamicPastPaperFinder productId={OCR_PHYSICS_PRODUCT_ID} subjectName="OCR Physics" tier="free" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Free A* AI – OCR Physics A-Level Revision | Try Now" description="Try A* AI free for OCR Physics." canonical="https://astarai.co.uk/ocr-physics-free-version" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={OCR_PHYSICS_PRODUCT_ID} subjectName="OCR Physics" subjectDescription="Your personal A* Physics tutor. Ask me anything!" footerText="Powered by A* AI • Trained on OCR Physics specification" placeholder="Ask about mechanics, waves, electricity..." suggestedPrompts={prompts} chatRef={chatRef} examDates={examDates} promptLabels={['Topic', 'Concept', 'Exam technique', 'Revision']} trainerAvatarUrl={tc.trainer_image_url || undefined} trainerName={tc.trainer_name || undefined} trainerStatus={tc.trainer_status || undefined} trainerAchievements={tc.trainer_achievements.length > 0 ? tc.trainer_achievements : undefined} trainerDescription={tc.trainer_description || undefined} useEmojiStars />
      </div>
    </div>
  );
};
