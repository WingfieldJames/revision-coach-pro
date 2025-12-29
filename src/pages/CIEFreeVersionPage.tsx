import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';

export const CIEFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – CIE Economics A-Level Revision | Try Now"
        description="Try A* AI free for CIE/Cambridge Economics. AI trained on CIE past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/cie-free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/UuE_HD759RpXk9-xsbZa7"
          width="100%"
          style={{ height: '100%', minHeight: '700px' }}
          frameBorder="0"
          allow="clipboard-write"
          title="A* AI CIE Free Version Chatbot"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
};