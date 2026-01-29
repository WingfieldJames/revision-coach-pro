import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotFullscreenPaths } from '@/components/ui/chatbot-fullscreen-paths';
import { RAGChat } from '@/components/RAGChat';
import { OCR_PHYSICS_EXAMS } from '@/components/ExamCountdown';

const OCR_PHYSICS_PRODUCT_ID = "a59c3bd2-f82d-4e44-a4ad-2c418ab61ea2";

const OCR_PHYSICS_PROMPTS = [
  { text: "Explain Newton's laws of motion" },
  { text: "What is electromagnetic induction?" },
  { text: "How do I approach a 6-mark question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRPhysicsFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Physics A-Level Revision | Try Now"
        description="Try A* AI free for OCR Physics. AI trained on OCR Physics past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-physics-free-version"
      />
      <ChatbotFullscreenPaths />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showExamCountdown
          examDates={OCR_PHYSICS_EXAMS}
          examSubjectName="OCR Physics"
          toolsLocked 
          hideUserDetails 
          productId={OCR_PHYSICS_PRODUCT_ID}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={OCR_PHYSICS_PRODUCT_ID}
          subjectName="OCR Physics"
          subjectDescription="Your personal A* Physics tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Physics specification"
          placeholder="Ask about mechanics, waves, electricity..."
          tier="free"
          suggestedPrompts={OCR_PHYSICS_PROMPTS}
        />
      </div>
    </div>
  );
};
