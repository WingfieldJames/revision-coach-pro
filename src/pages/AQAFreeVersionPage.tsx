import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { ChatbotBackgroundPaths } from '@/components/ui/chatbot-background-paths';
import { supabase } from '@/integrations/supabase/client';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';

export const AQAFreeVersionPage = () => {
  const [chatbotUrl, setChatbotUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-chatbot-url', {
          body: { productSlug: 'aqa-economics', tier: 'free' },
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
        title="Free A* AI – AQA Economics A-Level Revision | Try Now"
        description="Try A* AI free for AQA Economics. AI trained on AQA past papers for spec-aligned responses. Upgrade to Deluxe for full mark scheme feedback."
        canonical="https://astarai.co.uk/aqa-free-version"
      />
      <ChatbotBackgroundPaths />
      <div className="relative z-10">
        <Header 
          showImageTool 
          showDiagramTool 
          showEssayMarker 
          showExamCountdown
          examDates={AQA_ECONOMICS_EXAMS}
          examSubjectName="AQA Economics"
          toolsLocked 
          hideUserDetails 
        />
      </div>
      
      <div className="flex-1 relative z-10">
        {chatbotUrl ? (
          <iframe
            src={chatbotUrl}
            className="w-full h-full border-none absolute inset-0"
            style={{ minHeight: '700px' }}
            title="A* AI AQA Free Version Chatbot"
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
