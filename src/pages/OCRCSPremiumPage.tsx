import React, { useRef } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { OCR_CS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const OCR_CS_PRODUCT_ID = "5d05830b-de7b-4206-8f49-6d3695324eb6";

const DEFAULT_PROMPTS = [
  { text: "Explain binary search algorithm" },
  { text: "What are the different data types?" },
  { text: "How do I structure a long answer question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRCSPremiumPage = () => {
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(OCR_CS_PRODUCT_ID);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : OCR_CS_EXAMS;

  const sharedProps = {
    subjectName: "OCR Computer Science",
    productId: OCR_CS_PRODUCT_ID,
    productSlug: "ocr-computer-science",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    pastPaperBoard: "ocr-cs" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "ocr-cs" as const,
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "cs" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    examDates,
    examSubjectName: "OCR Computer Science",
    showMyMistakes: resolveFeature(tc, 'my_mistakes', true),
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={OCR_CS_PRODUCT_ID} subjectName="OCR Computer Science" tier="deluxe" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – OCR Computer Science | Full Past Paper Training" description="Access A* AI Deluxe for OCR Computer Science." canonical="https://astarai.co.uk/ocr-cs-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={OCR_CS_PRODUCT_ID} subjectName="OCR Computer Science Deluxe" subjectDescription="Your personal A* Computer Science tutor with full diagram access. Ask me anything!" footerText="Powered by A* AI • Trained on OCR Computer Science specification (2017-2025)" placeholder="Ask about algorithms, data structures, programming..." suggestedPrompts={prompts} enableDiagrams diagramSubject="cs" chatRef={chatRef} />
      </div>
    </div>
  );
};
