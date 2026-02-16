import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { OCR_PHYSICS_EXAMS } from '@/components/ExamCountdown';

// Correct OCR Physics product ID from database
const OCR_PHYSICS_PRODUCT_ID = "ecd5978d-3bf4-4b9c-993f-30b7f3a0f197";

const OCR_PHYSICS_PROMPTS = [
  { text: "Explain Newton's laws of motion" },
  { text: "What is electromagnetic induction?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRPhysicsFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Physics A-Level Revision | Try Now"
        description="Try A* AI free for OCR Physics. AI trained on OCR Physics past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-physics-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={OCR_PHYSICS_EXAMS}
          examSubjectName="OCR Physics"
          hideUserDetails 
          productId={OCR_PHYSICS_PRODUCT_ID}
          productSlug="ocr-physics"
          showUpgradeButton
          essayMarkerLabel="6-Marker Analysis"
          essayMarkerFixedMark={6}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={OCR_PHYSICS_PRODUCT_ID}
          subjectName="OCR Physics"
          subjectDescription="Your personal A* Physics tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Physics specification"
          placeholder="Ask about mechanics, waves, electricity..."
          suggestedPrompts={OCR_PHYSICS_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
