import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { RAGChat } from '@/components/RAGChat';

// OCR Physics product ID
const OCR_PHYSICS_PRODUCT_ID = 'ecd5978d-3bf4-4b9c-993f-30b7f3a0f197';

export const TestRAGChatPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Test RAG Chat | A* AI"
        description="Test the RAG chatbot"
        canonical="https://astarai.co.uk/test-rag"
      />
      <Header showNavLinks />
      
      <div className="flex-1">
        <RAGChat 
          productId={OCR_PHYSICS_PRODUCT_ID} 
          placeholder="Ask me anything about OCR Physics A-Level..."
        />
      </div>
    </div>
  );
};
