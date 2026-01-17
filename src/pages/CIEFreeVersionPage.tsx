import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotBackgroundPaths } from '@/components/ui/chatbot-background-paths';
import { supabase } from '@/integrations/supabase/client';

export const CIEFreeVersionPage = () => {
  const [chatbotUrl, setChatbotUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-chatbot-url', {
          body: { productSlug: 'cie-economics', tier: 'free' },
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
        title="Free A* AI – CIE Economics A-Level Revision | Try Now"
        description="Try A* AI free for CIE/Cambridge Economics. AI trained on CIE past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/cie-free-version"
      />
      <ChatbotBackgroundPaths />
      <div className="relative z-10">
        <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked hideUserDetails />
      </div>
      
      <div className="flex-1 relative z-10">
        {chatbotUrl ? (
          <iframe
            src={chatbotUrl}
            width="100%"
            style={{ height: '100%', minHeight: '700px' }}
            frameBorder="0"
            allow="clipboard-write"
            title="A* AI CIE Free Version Chatbot"
            className="absolute inset-0"
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
