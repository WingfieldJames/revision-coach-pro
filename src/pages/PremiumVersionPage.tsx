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
import { EDEXCEL_ECONOMICS_EXAMS } from '@/components/ExamCountdown';
import { useTrainerConfig, resolveFeature } from '@/hooks/useTrainerConfig';
import { DynamicPastPaperFinder } from '@/components/DynamicPastPaperFinder';
import { DynamicRevisionGuide } from '@/components/DynamicRevisionGuide';

const EDEXCEL_PRODUCT_ID = "6dc19d53-8a88-4741-9528-f25af97afb21";

const DEFAULT_PROMPTS = [
  { text: "Find all PEQs related to externalities" },
  { text: "Explain Spec Point 2.2 (AD)" },
  { text: "How do I structure a 25 marker" },
  { text: "Give me application for trade agreements" },
];

export const PremiumVersionPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const chatRef = useRef<RAGChatRef>(null);
  const tc = useTrainerConfig(EDEXCEL_PRODUCT_ID);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const handleEssayMarkerSubmit = (message: string, imageDataUrl?: string) => { chatRef.current?.submitMessage(message, imageDataUrl); };

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        if (!user) { navigate('/login?redirect=premium'); return; }
        try {
          const access = await checkProductAccess(user.id, 'edexcel-economics');
          if (!access.hasAccess || access.tier !== 'deluxe') { navigate('/compare'); return; }
          setHasAccess(true);
          setCheckingAccess(false);
        } catch { navigate('/compare'); }
      }
    };
    verifyAccess();
  }, [user, loading, navigate]);

  if (loading || checkingAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading...</p></div></div>);
  }
  if (!user || !hasAccess) {
    return (<div className="h-screen w-screen bg-background flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Premium Access Required</h1><p className="text-muted-foreground mb-6">You need a premium subscription to access this content.</p><Button variant="brand" onClick={() => navigate('/compare')}>Upgrade to Premium</Button></div></div>);
  }

  const prompts = tc.suggested_prompts.length > 0 ? tc.suggested_prompts : DEFAULT_PROMPTS;
  const examDates = tc.exam_dates.length > 0 ? tc.exam_dates : EDEXCEL_ECONOMICS_EXAMS;

  const sharedProps = {
    subjectName: "Edexcel Economics",
    productId: EDEXCEL_PRODUCT_ID,
    productSlug: "edexcel-economics",
    showMyAI: resolveFeature(tc, 'my_ai', true),
    showDiagramTool: resolveFeature(tc, 'diagram_generator', true),
    diagramSubject: "economics" as const,
    customDiagramData: tc.diagram_library.length > 0 ? tc.diagram_library : undefined,
    showGradeBoundaries: resolveFeature(tc, 'grade_boundaries', true),
    gradeBoundariesData: tc.grade_boundaries_data,
    showPastPaperFinder: resolveFeature(tc, 'past_papers', true),
    showMockExam: true,
    mockExamBoard: "Edexcel",
    mockExamSubject: "Economics",
    showRevisionGuide: resolveFeature(tc, 'revision_guide', true),
    revisionGuideBoard: "edexcel" as const,
    showEssayMarker: resolveFeature(tc, 'essay_marker', true),
    showExamCountdown: resolveFeature(tc, 'exam_countdown', true),
    showMyMistakes: resolveFeature(tc, 'my_mistakes', false),
    examDates,
    examSubjectName: "Edexcel Economics",
    onEssayMarkerSubmit: handleEssayMarkerSubmit,
    essayMarkerCustomMarks: tc.essay_marker_marks.length > 0 ? tc.essay_marker_marks : undefined,
    customPastPaperContent: <DynamicPastPaperFinder productId={EDEXCEL_PRODUCT_ID} subjectName="Edexcel Economics" tier="deluxe" />,
    customRevisionGuideContent: <DynamicRevisionGuide productId={EDEXCEL_PRODUCT_ID} subjectName="Edexcel Economics" tier="deluxe" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Deluxe A* AI – Edexcel Economics | Full Past Paper Training" description="Access A* AI Deluxe for Edexcel Economics." canonical="https://astarai.co.uk/premium" />
      <RandomChatbotBackground />
      <ChatbotSidebar {...sharedProps} />
      <ChatbotToolbar {...sharedProps} />
      <div className="flex-1 relative z-10">
        <RAGChat 
          productId={EDEXCEL_PRODUCT_ID}
          subjectName="Edexcel Economics"
          subjectDescription="Your personal A* Economics tutor. Ask me anything about Edexcel A-Level Economics!"
          footerText="Powered by A* AI • Trained on Edexcel Economics specification"
          placeholder="Ask about microeconomics, macroeconomics, diagrams, exam technique..."
          suggestedPrompts={prompts}
          enableDiagrams
          diagramSubject="economics"
          chatRef={chatRef}
          examDates={examDates}
          promptLabels={['Diagram', 'Spec point', 'Exam technique', 'Application']}
          trainerAvatarUrl={tc.trainer_image_url || undefined}
          trainerName={tc.trainer_name || undefined}
          trainerStatus={tc.trainer_status || undefined}
          trainerAchievements={tc.trainer_achievements.length > 0 ? tc.trainer_achievements : undefined}
          trainerDescription={tc.trainer_description || undefined}
          useEmojiStars
        />
      </div>
    </div>
  );
};
