import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RAGChat } from '@/components/RAGChat';

export const OCRCSFreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Computer Science A-Level Revision | Try Now"
        description="Try A* AI free for OCR Computer Science. AI trained on OCR CS specification for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-cs-free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked hideUserDetails />
      
      <div className="flex-1 relative">
        <RAGChat 
          productId="5d05830b-de7b-4206-8f49-6d3695324eb6"
          subjectName="OCR Computer Science"
          subjectDescription="Your personal A* Computer Science tutor. Ask me anything!"
          footerText="Powered by A* AI • Trained on OCR Computer Science specification"
          placeholder="Ask about algorithms, data structures, programming..."
        />
      </div>
    </div>
  );
};
