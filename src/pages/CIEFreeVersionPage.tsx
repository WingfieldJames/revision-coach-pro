import React, { useEffect } from 'react';
import { Header } from '@/components/Header';

export const CIEFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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