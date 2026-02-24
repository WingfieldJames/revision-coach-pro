import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { checkProductAccess } from '@/lib/productAccess';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type Subject = 'economics' | 'computer-science' | 'physics' | 'chemistry' | 'psychology' | 'mathematics';
type ExamBoard = 'edexcel' | 'aqa' | 'cie' | 'ocr';

const PRODUCT_IDS: Record<string, string> = {
  'edexcel-economics': '6dc19d53-8a88-4741-9528-f25af97afb21',
  'aqa-economics': '17ade690-8c44-4961-83b5-0edf42a9faea',
  'cie-economics': '9a710cf9-0523-4c1f-82c6-0e02b19087e5',
  'ocr-computer-science': '5d05830b-de7b-4206-8f49-6d3695324eb6',
  'ocr-physics': 'ecd5978d-3bf4-4b9c-993f-30b7f3a0f197',
  'aqa-chemistry': '3e5bf02e-1424-4bb3-88f9-2a9c58798444',
  'aqa-psychology': 'c56bc6d6-5074-4e1f-8bf2-8e900ba928ec',
  'edexcel-mathematics': 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
};

const subjectLabels: Record<Subject, string> = {
  'economics': 'Economics',
  'computer-science': 'Computer Science',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'psychology': 'Psychology',
  'mathematics': 'Mathematics'
};

export function SubjectPlanSelector() {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>(() => {
    const saved = localStorage.getItem('preferred-subject');
    return saved === 'economics' || saved === 'computer-science' || saved === 'physics' || saved === 'chemistry' || saved === 'psychology' || saved === 'mathematics' ? saved as Subject : 'economics';
  });
  const [examBoard, setExamBoard] = useState<ExamBoard>(() => {
    const savedSubject = localStorage.getItem('preferred-subject');
    const saved = localStorage.getItem('preferred-exam-board');
    if (savedSubject === 'computer-science' || savedSubject === 'physics') return 'ocr';
    if (savedSubject === 'chemistry' || savedSubject === 'psychology') return 'aqa';
    if (savedSubject === 'mathematics') return 'edexcel';
    return saved === 'edexcel' || saved === 'aqa' || saved === 'cie' ? saved as ExamBoard : 'edexcel';
  });
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [subscriptionPaymentType, setSubscriptionPaymentType] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const getCurrentProductSlug = () => {
    if (subject === 'economics') {
      if (examBoard === 'aqa') return 'aqa-economics';
      if (examBoard === 'cie') return 'cie-economics';
      return 'edexcel-economics';
    }
    if (subject === 'computer-science') return 'ocr-computer-science';
    if (subject === 'physics') return 'ocr-physics';
    if (subject === 'chemistry') return 'aqa-chemistry';
    if (subject === 'psychology') return 'aqa-psychology';
    if (subject === 'mathematics') return 'edexcel-mathematics';
    return null;
  };

  const getBoardLabel = () => {
    if (examBoard === 'cie') return 'CIE';
    if (examBoard === 'aqa') return 'AQA';
    if (examBoard === 'ocr') return 'OCR';
    return 'Edexcel';
  };

  useEffect(() => {
    const checkAccess = async () => {
      const productSlug = getCurrentProductSlug();
      if (!user || loading || !productSlug) {
        setHasProductAccess(false);
        return;
      }
      setCheckingAccess(true);
      try {
        const access = await checkProductAccess(user.id, productSlug);
        setHasProductAccess(access.hasAccess);
        setSubscriptionPaymentType(access.subscription?.payment_type ?? null);
      } catch (error) {
        console.error('Error checking product access:', error);
        setHasProductAccess(false);
      }
      setCheckingAccess(false);
    };
    checkAccess();
  }, [user, subject, examBoard, loading]);

  useEffect(() => {
    localStorage.setItem('preferred-subject', subject);
    localStorage.setItem('preferred-exam-board', examBoard);
  }, [subject, examBoard]);

  const handleFreeClick = async () => {
    const getFreePath = () => {
      if (subject === 'computer-science') return '/ocr-cs-free-version';
      if (subject === 'physics') return '/ocr-physics-free-version';
      if (subject === 'chemistry') return '/aqa-chemistry-free-version';
      if (subject === 'psychology') return '/aqa-psychology-free-version';
      if (subject === 'mathematics') return '/edexcel-maths-free-version';
      if (examBoard === 'aqa') return '/aqa-free-version';
      if (examBoard === 'cie') return '/cie-free-version';
      return '/free-version';
    };
    if (!user) {
      const redirectPath = getFreePath().replace('/', '');
      window.location.href = `/login?redirect=${redirectPath}`;
      return;
    }
    window.location.href = getFreePath();
  };

  const handlePremiumClick = async (selectedPaymentType: 'monthly' | 'lifetime' = paymentType) => {
    if (!user) {
      window.location.href = '/login?redirect=stripe';
      return;
    }
    if (hasProductAccess) {
      const premiumPath = subject === 'computer-science' ? '/ocr-cs-premium' : subject === 'physics' ? '/ocr-physics-premium' : subject === 'chemistry' ? '/aqa-chemistry-premium' : subject === 'psychology' ? '/aqa-psychology-premium' : subject === 'mathematics' ? '/edexcel-maths-premium' : examBoard === 'aqa' ? '/aqa-premium' : examBoard === 'cie' ? '/cie-premium' : '/premium';
      window.location.href = premiumPath;
      return;
    }
    try {
      const productSlug = getCurrentProductSlug();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }
      const productId = productSlug ? PRODUCT_IDS[productSlug] : null;
      const affiliateCode = getValidAffiliateCode();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType: selectedPaymentType, productId, affiliateCode }
      });
      if (error) {
        const msg = (error as any).message || String(error);
        if (msg.includes('not_authenticated') || msg.includes('401')) {
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login?redirect=stripe';
          return;
        }
        alert(`Failed to create checkout session: ${msg}`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to create checkout session. Please try again.');
      }
    } catch (error) {
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="text-center">
      {/* Subject & Board Selection */}
      <ScrollReveal delay={0.1}>
        {/* Desktop: Connected toggle group + board dropdown on same line */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full px-6 py-2.5 text-sm font-medium border border-border bg-background text-foreground transition-all flex items-center gap-2 hover:bg-muted">
                Exam Board: {getBoardLabel()} — {subjectLabels[subject]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated min-w-[260px]">
              {([
                { s: 'economics' as Subject, b: 'edexcel' as ExamBoard, label: 'Economics (Edexcel)' },
                { s: 'economics' as Subject, b: 'aqa' as ExamBoard, label: 'Economics (AQA)' },
                { s: 'economics' as Subject, b: 'cie' as ExamBoard, label: 'Economics (CIE)' },
                { s: 'computer-science' as Subject, b: 'ocr' as ExamBoard, label: 'Computer Science (OCR)' },
                { s: 'physics' as Subject, b: 'ocr' as ExamBoard, label: 'Physics (OCR)' },
                { s: 'chemistry' as Subject, b: 'aqa' as ExamBoard, label: 'Chemistry (AQA)' },
                { s: 'psychology' as Subject, b: 'aqa' as ExamBoard, label: 'Psychology (AQA)' },
                { s: 'mathematics' as Subject, b: 'edexcel' as ExamBoard, label: 'Mathematics (Edexcel)' },
                { s: 'mathematics' as Subject, b: 'ocr' as ExamBoard, label: 'Mathematics (OCR)' },
              ]).map(({ s, b, label }) => (
                <DropdownMenuItem
                  key={`${s}-${b}`}
                  className={`cursor-pointer hover:bg-muted ${subject === s && examBoard === b ? 'font-semibold bg-muted' : ''}`}
                  onClick={() => { setSubject(s); setExamBoard(b); }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile: Single dropdown showing exam board, opens to show subjects */}
        <div className="flex md:hidden items-center justify-center mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full px-6 py-2.5 text-sm font-semibold border border-border bg-background text-foreground flex items-center gap-2 hover:bg-muted">
                Exam Board: {getBoardLabel()}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated min-w-[220px]">
              {([
                { s: 'economics' as Subject, b: 'edexcel' as ExamBoard, label: 'Economics (Edexcel)' },
                { s: 'economics' as Subject, b: 'aqa' as ExamBoard, label: 'Economics (AQA)' },
                { s: 'economics' as Subject, b: 'cie' as ExamBoard, label: 'Economics (CIE)' },
                { s: 'computer-science' as Subject, b: 'ocr' as ExamBoard, label: 'Computer Science (OCR)' },
                { s: 'physics' as Subject, b: 'ocr' as ExamBoard, label: 'Physics (OCR)' },
                { s: 'chemistry' as Subject, b: 'aqa' as ExamBoard, label: 'Chemistry (AQA)' },
                { s: 'psychology' as Subject, b: 'aqa' as ExamBoard, label: 'Psychology (AQA)' },
                { s: 'mathematics' as Subject, b: 'edexcel' as ExamBoard, label: 'Mathematics (Edexcel)' },
                { s: 'mathematics' as Subject, b: 'ocr' as ExamBoard, label: 'Mathematics (OCR)' },
              ]).map(({ s, b, label }) => (
                <DropdownMenuItem
                  key={`${s}-${b}`}
                  className={`cursor-pointer hover:bg-muted ${subject === s && examBoard === b ? 'font-semibold bg-muted' : ''}`}
                  onClick={() => { setSubject(s); setExamBoard(b); }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ScrollReveal>

      {/* Single Horizontal Plan Card - "The Plan" */}
      <ScrollReveal delay={0.2}>
        <div id="pricing" className="max-w-3xl mx-auto mb-8">
          <div className="bg-muted/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-border/50 shadow-elevated text-left">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold mb-1">{hasProductAccess ? "You're Deluxe!" : "The Plan"}</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  {hasProductAccess ? "You have access to:" : `Everything you need to ace your ${subjectLabels[subject]} exam`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>AI trained on all past papers & mark schemes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Full A* exam technique + essay structures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Essay Marker with instant feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Diagram Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Past Paper Finder (2,000+ questions)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Image upload & {getBoardLabel()} analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Covers entire {getBoardLabel()} specification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Personalised revision plans</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => hasProductAccess ? handlePremiumClick() : handleFreeClick()}
                className="w-full sm:w-auto px-10 py-3.5 rounded-full text-white font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 glow-brand hover:glow-brand-intense bg-gradient-brand"
              >
                {hasProductAccess ? "Go to your chat →" : "Get Started →"}
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                {hasProductAccess
                  ? (subscriptionPaymentType === 'lifetime' ? 'Exam season pass active' : 'Monthly pass active')
                  : 'Free to start • No credit card required'}
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
        <p className="text-xs md:text-sm text-muted-foreground mt-2 whitespace-nowrap">
          Secure checkout via Stripe • Your chats stay private
        </p>
      </ScrollReveal>
    </div>
  );
}
