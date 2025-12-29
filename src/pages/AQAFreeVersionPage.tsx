import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';

export const AQAFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – AQA Economics A-Level Revision | Try Now"
        description="Try A* AI free for AQA Economics. AI trained on AQA past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/rRsRPPSXyI-f4kL8JHcyz"
          className="w-full h-full border-none absolute inset-0"
          style={{ minHeight: '700px' }}
          title="A* AI AQA Free Version Chatbot"
        />
      </div>
    </div>
  );
};
