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
import { SubjectFeatureGrid } from '@/components/SubjectFeatureGrid';

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
  'edexcel-mathematics': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'aqa-mathematics': '5b3ea521-7803-40e6-8772-7f644a374deb',
  'ocr-maths': '7469e99a-c34e-4500-9aee-11a107a4af09'
};

const subjectLabels: Record<Subject, string> = {
  'economics': 'Economics',
  'computer-science': 'Computer Science',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'psychology': 'Psychology',
  'mathematics': 'Mathematics'
};

const BOARDS_MAP: Record<Subject, ExamBoard[]> = {
  'economics': ['edexcel', 'aqa', 'cie'],
  'computer-science': ['ocr'],
  'physics': ['ocr'],
  'chemistry': ['aqa'],
  'psychology': ['aqa'],
  'mathematics': ['edexcel', 'aqa', 'ocr'],
};

export function SubjectPlanSelector() {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>(() => {
    const saved = localStorage.getItem('preferred-subject');
    return saved === 'economics' || saved === 'computer-science' || saved === 'physics' || saved === 'chemistry' || saved === 'psychology' || saved === 'mathematics' ? saved as Subject : 'economics';
  });
  const [examBoard, setExamBoard] = useState<ExamBoard | ''>(() => {
    try {
      const map = JSON.parse(localStorage.getItem('preferred-exam-boards') || '{}');
      const savedSubject = localStorage.getItem('preferred-subject') as Subject | null;
      const validSubject = savedSubject && BOARDS_MAP[savedSubject] ? savedSubject : 'economics';
      const saved = map[validSubject];
      if (saved && BOARDS_MAP[validSubject]?.includes(saved as ExamBoard)) return saved as ExamBoard;
    } catch {}
    return '';
  });
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [subscriptionPaymentType, setSubscriptionPaymentType] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const getCurrentProductSlug = () => {
    if (!examBoard) return null;
    if (subject === 'economics') {
      if (examBoard === 'aqa') return 'aqa-economics';
      if (examBoard === 'cie') return 'cie-economics';
      return 'edexcel-economics';
    }
    if (subject === 'computer-science') return 'ocr-computer-science';
    if (subject === 'physics') return 'ocr-physics';
    if (subject === 'chemistry') return 'aqa-chemistry';
    if (subject === 'psychology') return 'aqa-psychology';
    if (subject === 'mathematics' && examBoard === 'ocr') return 'ocr-maths';
    if (subject === 'mathematics' && examBoard === 'aqa') return 'aqa-mathematics';
    if (subject === 'mathematics') return 'edexcel-mathematics';
    return null;
  };

  const formatBoard = (b: string) => {
    if (b === 'cie') return 'CIE';
    if (b === 'aqa') return 'AQA';
    if (b === 'ocr') return 'OCR';
    if (b === 'edexcel') return 'Edexcel';
    return b.toUpperCase();
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
    if (examBoard) {
      try {
        const map = JSON.parse(localStorage.getItem('preferred-exam-boards') || '{}');
        map[subject] = examBoard;
        localStorage.setItem('preferred-exam-boards', JSON.stringify(map));
      } catch {}
    }
  }, [subject, examBoard]);

  const handleFreeClick = async () => {
    const getFreePath = () => {
      if (subject === 'computer-science') return '/ocr-cs-free-version';
      if (subject === 'physics') return '/ocr-physics-free-version';
      if (subject === 'chemistry') return '/aqa-chemistry-free-version';
      if (subject === 'psychology') return '/aqa-psychology-free-version';
      if (subject === 'mathematics' && examBoard === 'ocr') return '/s/ocr-maths/free';
      if (subject === 'mathematics' && examBoard === 'aqa') return '/s/aqa-mathematics/free';
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
      const premiumPath = subject === 'computer-science' ? '/ocr-cs-premium' : subject === 'physics' ? '/ocr-physics-premium' : subject === 'chemistry' ? '/aqa-chemistry-premium' : subject === 'psychology' ? '/aqa-psychology-premium' : (subject === 'mathematics' && examBoard === 'ocr') ? '/s/ocr-maths/premium' : (subject === 'mathematics' && examBoard === 'aqa') ? '/s/aqa-mathematics/premium' : subject === 'mathematics' ? '/edexcel-maths-premium' : examBoard === 'aqa' ? '/aqa-premium' : examBoard === 'cie' ? '/cie-premium' : '/premium';
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

  const boardsForSubject = BOARDS_MAP[subject] || [];

  return (
    <div className="text-center">
      {/* Subject Tabs */}
      <ScrollReveal delay={0.1}>
        <div className="hidden md:flex flex-col items-center gap-3 mb-12">
          <div className="flex items-center gap-3">
            {/* Qualification Level Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted transition-all whitespace-nowrap" style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem' }}>
                  A-Level
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => { localStorage.setItem('qualification_level', 'alevel'); }}>
                  A-Level
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => { localStorage.setItem('qualification_level', 'gcse'); navigate('/gcse'); }}>
                  GCSE
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="inline-flex rounded-full border border-border bg-background p-1.5 gap-1">
            {(['economics', 'mathematics', 'computer-science', 'psychology', 'chemistry', 'physics'] as Subject[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSubject(s);
                  try {
                    const map = JSON.parse(localStorage.getItem('preferred-exam-boards') || '{}');
                    setExamBoard((map[s] || '') as ExamBoard);
                  } catch { setExamBoard(''); }
                }}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                  subject === s
                    ? 'bg-gradient-brand text-white'
                    : 'text-foreground'
                }`}
              >
                {subjectLabels[s]}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-center gap-3 mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-brand text-white flex items-center gap-2 glow-brand">
                {subjectLabels[subject]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
              {(['economics', 'mathematics', 'computer-science', 'psychology', 'chemistry', 'physics'] as Subject[]).map(s => (
                <DropdownMenuItem key={s} className="cursor-pointer hover:bg-muted" onClick={() => {
                  setSubject(s);
                  try {
                    const map = JSON.parse(localStorage.getItem('preferred-exam-boards') || '{}');
                    setExamBoard((map[s] || '') as ExamBoard);
                  } catch { setExamBoard(''); }
                }}>
                  {subjectLabels[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ScrollReveal>

      {/* Feature Grid */}
      <ScrollReveal delay={0.2}>
        <SubjectFeatureGrid
          subject={subject}
          subjectLabel={subjectLabels[subject]}
          examBoard={examBoard}
          formattedBoard={examBoard ? formatBoard(examBoard) : ''}
          hasAccess={hasProductAccess}
          subscriptionPaymentType={subscriptionPaymentType}
          onCtaClick={() => hasProductAccess ? handlePremiumClick() : handleFreeClick()}
          boards={boardsForSubject}
          onBoardChange={(b) => setExamBoard(b as ExamBoard)}
        />
      </ScrollReveal>
    </div>
  );
}
