import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { RandomChatbotBackground } from '@/components/ui/random-chatbot-background';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RAGChat, RAGChatRef } from '@/components/RAGChat';
import { ChatbotSidebar } from '@/components/ChatbotSidebar';
import { ChatbotToolbar } from '@/components/ChatbotToolbar';
import { checkProductAccess } from '@/lib/productAccess';
import { AQA_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const AQA_PRODUCT_ID = "17ade690-8c44-4961-83b5-0edf42a9faea";

const DEFAULT_PROMPTS = [
  { text: "Explain Spec Point (4.1.5 Market Structures)" },
  { text: "Find all past exam questions on Economic Growth" },
  { text: "Layout the structure of the exam" },
  { text: "Create me a full revision plan", usesPersonalization: true },
];

export const AQAPremiumPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(AQA_PRODUCT_ID);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        if (!user) { navigate('/login?redirect=aqa-premium'); return; }
        try {
          const access = await checkProductAccess(user.id, 'aqa-economics');
          if (!access.hasAccess || access.tier !== 'deluxe') { navigate('/compare'); return; }
          setHasAccess(true); setCheckingAccess(false);
        } catch { navigate('/compare'); }
      }
    };
    verifyAccess();
  }, [user, loading, navigate]);

  if (loading || checkingAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading...</p></div></div>);
  }
  if (!user || !hasAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><p className="text-muted-foreground mb-6">You need a premium subscription.</p><Button variant="brand" onClick={() => navigate('/compare')}>Upgrade to Premium</Button></div></div>);
  }

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : AQA_ECONOMICS_EXAMS;

  const sharedProps = {
    subjectName: "AQA Economics",
    productId: AQA_PRODUCT_ID,
    productSlug: "aqa-economics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "economics" as const,
    customDiagramData: tc.diagram_library.length > 0 ? tc.diagram_library : undefined,
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    pastPaperBoard: "aqa" as const,
    showRevisionGuide: resolveFeature(tc, 'revision_guide', false),
    revisionGuideBoard: "aqa" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "AQA Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customRevisionGuideContent: <DynamicRevisionGuide productId={AQA_PRODUCT_ID} subjectName="AQA Economics" tier="deluxe" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – AQA Economics | Full Past Paper Training" description="Access A* AI Deluxe for AQA Economics." canonical="https://astarai.co.uk/aqa-premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat productId={AQA_PRODUCT_ID} subjectName="AQA Economics" subjectDescription="Your personal A* Economics tutor. Ask me anything about AQA A-Level Economics!" footerText="Powered by A* AI • Trained on AQA Economics specification" placeholder="Ask about microeconomics, macroeconomics, diagrams, exam technique..." suggestedPrompts={prompts} enableDiagrams diagramSubject="economics" chatRef={chatRef} />
      </div>
    </div>
  );
};
