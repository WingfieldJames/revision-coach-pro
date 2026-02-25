import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { OCR_CS_EXAMS } from '@/components/ExamCountdown';

const OCR_CS_PRODUCT_ID = "5d05830b-de7b-4206-8f49-6d3695324eb6";

const OCR_CS_PROMPTS = [
  { text: "Explain binary search algorithm" },
  { text: "What are the different data types?" },
  { text: "How do I structure a long answer question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRCSFreeVersionPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => {
    chatRef.current?.submitMessage(message, imageDataUrl);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Computer Science A-Level Revision | Try Now"
        description="Try A* AI free for OCR Computer Science. AI trained on OCR CS specification for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-cs-free-version"
      />
      <RandomChatbotBackground />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showPastPaperFinder
          showRevisionGuide
          showExamCountdown
          examDates={OCR_CS_EXAMS}
          examSubjectName="OCR Computer Science"
          hideUserDetails 
          diagramSubject="cs"
          pastPaperBoard="ocr-cs"
          revisionGuideBoard="ocr-cs"
          productId={OCR_CS_PRODUCT_ID}
          productSlug="ocr-computer-science"
          showUpgradeButton
          essayMarkerCustomMarks={[9, 12]}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={OCR_CS_PRODUCT_ID}
          subjectName="OCR Computer Science"
          subjectDescription="Your personal A* Computer Science tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Computer Science specification"
          placeholder="Ask about algorithms, data structures, programming..."
          suggestedPrompts={OCR_CS_PROMPTS}
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
