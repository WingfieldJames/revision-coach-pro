import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

export const FreeVersionPage = () => {
  const [chatbotUrl, setChatbotUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-chatbot-url', {
          body: { productSlug: 'edexcel-economics', tier: 'free' },
        });
        
        if (!error && data?.url) {
          setChatbotUrl(data.url);
        }
      } catch (err) {
        console.error('Error fetching chatbot URL:', err);
      }
    };
    
    fetchUrl();
  }, []);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Free A* AI – Edexcel Economics A-Level Revision | Try Now"
        description="Try A* AI free – AI trained on Edexcel Economics past papers. Get spec-aligned responses and quick practice. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/free-version"
      />
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked hideUserDetails />
      
      <div className="flex-1 relative">
        {chatbotUrl ? (
          <iframe
            src={chatbotUrl}
            allow="clipboard-write"
            className="w-full h-full border-none absolute inset-0"
            title="A* AI Free Version Chatbot"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
};
