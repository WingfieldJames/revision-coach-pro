import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotFullscreenPaths } from '@/components/ui/chatbot-fullscreen-paths';
import { RAGChat } from '@/components/RAGChat';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

const OCR_CS_PROMPTS = [
  { text: "Explain binary search algorithm" },
  { text: "What are the different data types?" },
  { text: "How do I structure a long answer question?" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const OCRCSFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Computer Science A-Level Revision | Try Now"
        description="Try A* AI free for OCR Computer Science. AI trained on OCR CS specification for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-cs-free-version"
      />
      <ChatbotFullscreenPaths />
      <div className="relative z-10">
        <Header 
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="OCR Computer Science"
          toolsLocked 
          hideUserDetails 
        />
      </div>
      
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId="5d05830b-de7b-4206-8f49-6d3695324eb6"
          subjectName="OCR Computer Science"
          subjectDescription="Your personal A* Computer Science tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Computer Science specification"
          placeholder="Ask about algorithms, data structures, programming..."
          tier="free"
          suggestedPrompts={OCR_CS_PROMPTS}
        />
      </div>
    </div>
  );
};
