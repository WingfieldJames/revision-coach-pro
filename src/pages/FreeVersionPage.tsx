import React from 'react';
import { Header } from '@/components/Header';

export const FreeVersionPage = () => {
  return (
    <div className="h-screen w-screen bg-background">
      <Header showBackButton backUrl="/compare" />
      
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/rdUsQQiBG6DHV2jFtXzn5"
          allow="clipboard-write"
          className="w-full h-full border-none"
          title="A* AI Free Version Chatbot"
        />
      </div>
    </div>
  );
};