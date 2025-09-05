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
          className="w-full h-full border-none absolute inset-0"
          title="A* AI Free Version Chatbot"
        />
      </div>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <span className="text-xl font-semibold">A* AI</span>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="hover:text-foreground transition-colors">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="hover:text-foreground transition-colors">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
          <p className="text-sm text-muted-foreground">
            © A* AI
          </p>
        </div>
      </footer>
    </div>
  );
};