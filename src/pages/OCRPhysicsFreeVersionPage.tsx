import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';

export const OCRPhysicsFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – OCR Physics A-Level Revision | Try Now"
        description="Try A* AI free for OCR Physics. AI trained on OCR Physics past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/ocr-physics-free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked hideUserDetails />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/VBv4qqbbRjfZ_eFquDXBl"
          width="100%"
          style={{ height: '100%', minHeight: '700px' }}
          frameBorder="0"
          allow="clipboard-write"
          title="A* AI OCR Physics Free Version Chatbot"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
};