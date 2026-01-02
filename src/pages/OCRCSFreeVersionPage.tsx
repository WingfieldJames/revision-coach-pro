import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';

export const OCRCSFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Computer Science A-Level Revision | Try Now"
        description="Try A* AI free for OCR Computer Science. AI trained on OCR CS past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-cs-free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/t9DaRQyfRFdgqWKI2fOnq"
          width="100%"
          style={{ height: '100%', minHeight: '700px' }}
          frameBorder="0"
          allow="clipboard-write"
          title="A* AI OCR Computer Science Free Version Chatbot"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
};
