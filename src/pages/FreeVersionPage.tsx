import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';

export const FreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/rdUsQQiBG6DHV2jFtXzn5"
          allow="clipboard-write"
          className="w-full h-full border-none absolute inset-0"
          title="A* AI Free Version Chatbot"
        />
      </div>
    </div>
  );
};
