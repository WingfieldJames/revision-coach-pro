import React, { useRef } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotFullscreenPaths } from '@/components/ui/chatbot-fullscreen-paths';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { OCR_CS_EXAMS } from '@/components/ExamCountdown';

const OCR_CS_PRODUCT_ID = "5d05830b-de7b-4206-8f49-6d3695324eb6";

const OCR_CS_PROMPTS = [
  { text: "Explain binary search algorithm" },
  { text: "What are the different data types?" },
  { text: "How do I structure a long answer question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRCSPremiumPage = () => {
  const chatRef = useRef<RAGChatRef>(null);

  const handleEssayMarkerSubmit = (message: string) => {
    chatRef.current?.submitMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – OCR Computer Science | Full Past Paper Training"
        description="Access A* AI Deluxe for OCR Computer Science. Full training on 2017-2025 past papers, mark schemes, A* technique & unlimited prompts."
        canonical="https://astarai.co.uk/ocr-cs-premium"
      />
      <ChatbotFullscreenPaths />
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <Header
          showImageTool 
          showDiagramTool 
          showEssayMarker
          showPastPaperFinder
          showExamCountdown
          examDates={OCR_CS_EXAMS}
          examSubjectName="OCR Computer Science"
          hideUserDetails 
          diagramSubject="cs"
          productId={OCR_CS_PRODUCT_ID}
          onEssayMarkerSubmit={handleEssayMarkerSubmit}
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={OCR_CS_PRODUCT_ID}
          subjectName="OCR Computer Science Deluxe"
          subjectDescription="Your personal A* Computer Science tutor with full diagram access. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Computer Science specification (2017-2025)"
          placeholder="Ask about algorithms, data structures, programming..."
          tier="deluxe"
          suggestedPrompts={OCR_CS_PROMPTS}
          enableDiagrams
          diagramSubject="cs"
          chatRef={chatRef}
        />
      </div>
    </div>
  );
};
