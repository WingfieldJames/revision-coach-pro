import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Check, Instagram } from 'lucide-react';
import { SubjectFeatureGrid } from '@/components/SubjectFeatureGrid';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { checkProductAccess } from '@/lib/productAccess';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { FlowFieldBackground } from '@/components/ui/flow-field-background';

interface DynamicProduct {
  id: string;
  slug: string;
  subject: string;
  exam_board: string;
  name: string;
}

export const GCSEComparePage = () => {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [gcseProducts, setGcseProducts] = useState<DynamicProduct[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [examBoard, setExamBoard] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [subscriptionPaymentType, setSubscriptionPaymentType] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Load GCSE products directly from products table
  useEffect(() => {
    const loadGCSEProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, slug, subject, exam_board, name, qualification_type')
        .eq('active', true);

      if (data) {
        const gcse = data.filter((p: any) => (p as any).qualification_type === 'GCSE');
        setGcseProducts(gcse as DynamicProduct[]);
        if (gcse.length > 0) {
          const first = gcse[0];
          setSubject(first.subject.toLowerCase().replace(/\s+/g, '-'));
          setExamBoard(first.exam_board.toLowerCase());
        }
      }
    };
    loadGCSEProducts();
  }, []);

  // Build subjects list
  const allSubjects = React.useMemo(() => {
    const subjects: string[] = [];
    for (const p of gcseProducts) {
      const key = p.subject.toLowerCase().replace(/\s+/g, '-');
      if (!subjects.includes(key)) subjects.push(key);
    }
    return subjects;
  }, [gcseProducts]);

  // Build subject labels
  const subjectLabels = React.useMemo(() => {
    const labels: Record<string, string> = {};
    for (const p of gcseProducts) {
      const key = p.subject.toLowerCase().replace(/\s+/g, '-');
      if (!labels[key]) labels[key] = p.subject;
    }
    return labels;
  }, [gcseProducts]);

  // Build boards for current subject
  const boardsForSubject = React.useMemo(() => {
    const boards: string[] = [];
    for (const p of gcseProducts) {
      const subjectKey = p.subject.toLowerCase().replace(/\s+/g, '-');
      const boardKey = p.exam_board.toLowerCase();
      if (subjectKey === subject && !boards.includes(boardKey)) boards.push(boardKey);
    }
    return boards;
  }, [subject, gcseProducts]);

  // Get current dynamic product
  const getCurrentProduct = React.useCallback(() => {
    return gcseProducts.find(p => {
      const subjectKey = p.subject.toLowerCase().replace(/\s+/g, '-');
      const boardKey = p.exam_board.toLowerCase();
      return subjectKey === subject && boardKey === examBoard;
    });
  }, [gcseProducts, subject, examBoard]);

  const getCurrentProductSlug = () => {
    const p = getCurrentProduct();
    return p?.slug || null;
  };

  // Check product access
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
    window.scrollTo(0, 0);
  }, []);

  const handleFreeClick = async () => {
    const product = getCurrentProduct();
    if (!product) return;
    const path = `/s/${product.slug}/free`;
    if (!user) {
      window.location.href = `/login?redirect=${path.replace('/', '')}`;
      return;
    }
    window.location.href = path;
  };

  const handlePremiumClick = async (selectedPaymentType: 'monthly' | 'lifetime' = paymentType) => {
    const product = getCurrentProduct();
    if (!product) return;

    if (!user) {
      window.location.href = '/login?redirect=stripe';
      return;
    }

    if (hasProductAccess) {
      window.location.href = `/s/${product.slug}/premium`;
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }
      const affiliateCode = getValidAffiliateCode();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType: selectedPaymentType, productId: product.id, affiliateCode }
      });
      if (error) {
        alert(`Failed to create checkout session: ${(error as any).message || String(error)}`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatBoard = (b: string) => {
    if (b === 'cie') return 'CIE';
    if (b === 'aqa') return 'AQA';
    if (b === 'ocr') return 'OCR';
    if (b === 'edexcel') return 'Edexcel';
    if (b === 'wjec') return 'WJEC';
    if (b === 'sqa') return 'SQA';
    return b.toUpperCase();
  };

  const hasSubjects = allSubjects.length > 0;

  return (
    <div className="min-h-screen font-sans relative">
      <SEOHead title="Choose Your GCSE A* AI Subject" description="Compare A* AI plans for GCSE revision. AI-powered tutoring for all GCSE subjects." canonical="https://astarai.co.uk/gcse" />
      {theme === 'dark' && !isMobile && <FlowFieldBackground color="#a855f7" trailOpacity={0.04} particleCount={400} />}
      <div className="relative z-10">
        <Header showNavLinks />

        <main className="pt-0 pb-8 px-4 sm:px-8 max-w-5xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h1 className="text-2xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-0 md:gap-0 flex-nowrap">
              <span className="self-center">Choose Your GCSE</span>
              <img src={currentLogo} alt="A* AI" className={`h-16 sm:h-20 md:h-24 inline-block -mx-2 md:-mx-3 ${theme === 'dark' ? '-translate-y-1 md:-translate-y-1.5' : ''}`} />
              <span className="self-center">Subject</span>
            </h1>
          </ScrollReveal>

          {!hasSubjects ? (
            <ScrollReveal delay={0.1}>
              <div className="max-w-md mx-auto mt-12 text-center space-y-4">
                <p className="text-muted-foreground">GCSE subjects are coming soon! Check back later.</p>
              </div>
            </ScrollReveal>
          ) : (
            <>
              {/* Subject & Board Selection - exact same design as A-Level compare page */}
              <ScrollReveal delay={0.1}>
                {/* Desktop */}
                <div className="hidden md:flex items-center justify-center gap-4 mb-12">
                  <div className="inline-flex rounded-full border border-border bg-background p-1.5 gap-1">
                    {allSubjects.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSubject(s);
                          const dp = gcseProducts.find(p => p.subject.toLowerCase().replace(/\s+/g, '-') === s);
                          if (dp) setExamBoard(dp.exam_board.toLowerCase());
                        }}
                        className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                          subject === s
                            ? 'bg-gradient-brand text-white'
                            : 'text-foreground'
                        }`}
                      >
                        {subjectLabels[s] || s}
                      </button>
                    ))}
                  </div>

                  {boardsForSubject.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full px-6 py-2 text-sm font-medium border border-border bg-background text-foreground transition-all flex items-center gap-2 whitespace-nowrap">
                          {formatBoard(examBoard)}
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                        {boardsForSubject.map(b => (
                          <DropdownMenuItem key={b} className="cursor-pointer flex items-center gap-2" onClick={() => setExamBoard(b)}>
                            {examBoard === b ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
                            {formatBoard(b)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {boardsForSubject.length === 1 && (
                    <span className="rounded-full px-6 py-2 text-sm font-medium border border-border bg-background text-foreground whitespace-nowrap">
                      {formatBoard(examBoard)}
                    </span>
                  )}
                </div>

                {/* Mobile */}
                <div className="md:hidden sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 flex items-center justify-center gap-3 mb-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-brand text-white flex items-center gap-2 glow-brand">
                        {subjectLabels[subject] || subject}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                      {allSubjects.map(s => (
                        <DropdownMenuItem key={s} className="cursor-pointer" onClick={() => {
                          setSubject(s);
                          const dp = gcseProducts.find(p => p.subject.toLowerCase().replace(/\s+/g, '-') === s);
                          if (dp) setExamBoard(dp.exam_board.toLowerCase());
                        }}>
                          {subjectLabels[s] || s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {boardsForSubject.length > 1 ? (
                    <Select value={examBoard} onValueChange={setExamBoard}>
                      <SelectTrigger className="rounded-full px-5 py-2.5 h-auto w-auto text-sm font-semibold border border-border bg-background text-foreground [&>svg]:ml-1">
                        <SelectValue placeholder="Board" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                        {boardsForSubject.map(b => (
                          <SelectItem key={b} value={b}>{formatBoard(b)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="rounded-full px-5 py-2.5 text-sm font-semibold border border-border bg-background text-foreground">
                      {formatBoard(examBoard)}
                    </span>
                  )}
                </div>
              </ScrollReveal>

              {/* Plan Card */}
              <ScrollReveal delay={0.2}>
                <div id="pricing" className="max-w-3xl mx-auto mb-12">
                  <div className="bg-muted/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-border/50 shadow-elevated text-left">
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl font-bold mb-1">{hasProductAccess ? "You're Deluxe!" : "The Plan"}</h2>
                      <p className="text-muted-foreground mb-6 text-sm">
                        {hasProductAccess ? "You have access to:" : `Everything you need to ace your GCSE ${subjectLabels[subject] || ''} exam`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>AI trained on all past papers & mark schemes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>Full exam technique + model answers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>Covers entire {formatBoard(examBoard)} specification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>Personalised revision plans</span>
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
            </>
          )}

          {!user && (
            <ScrollReveal className="max-w-4xl mx-auto mt-12 mb-12">
              <div className="p-6 bg-secondary rounded-lg">
                <p className="text-muted-foreground mb-4 text-center">
                  New to A* AI? Create an account to get started.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/login">Log In</Link>
                  </Button>
                  <Button variant="brand" asChild>
                    <Link to="/signup">Create Account</Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          )}
        </main>

        {/* Footer */}
        <footer className="py-16 px-8 text-center border-t border-border/30 relative">
          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={currentLogo} alt="A* AI" className="h-12 sm:h-14" />
              <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram size={20} />
              </a>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 A* AI. All rights reserved.</p>
          </ScrollReveal>
        </footer>
      </div>
    </div>
  );
};
