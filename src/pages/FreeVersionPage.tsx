import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';

export const FreeVersionPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showNavLinks />
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/rdUsQQiBG6DHV2jFtXzn5"
          allow="clipboard-write"
          className="w-full border-none absolute inset-0"
          style={{ height: 'calc(100vh - 88px)' }}
          title="A* AI Free Version Chatbot"
        />
      </div>
    </div>
  );
};