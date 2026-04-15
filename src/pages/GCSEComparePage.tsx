import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Check, Instagram, Youtube, Linkedin } from 'lucide-react';
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
import { TestimonialsSection } from '@/components/ui/testimonials-with-marquee';
import { allTestimonials as homeTestimonials } from '@/components/ui/testimonials-columns';
import { DynamicFounderSection } from '@/components/DynamicFounderSection';

interface DynamicProduct {
  id: string;
  slug: string;
  subject: string;
  exam_board: string;
  name: string;
}

const GCSE_SCIENCE_SUBJECTS = new Set(['physics', 'chemistry', 'biology', 'combined-science', 'science']);

const isGcseScienceSubject = (subjectKey: string) => GCSE_SCIENCE_SUBJECTS.has(subjectKey.toLowerCase());

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

  // Handle payment success redirect
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    if (paymentSuccess === 'true' && sessionId) {
      const verify = async () => {
        try {
          await supabase.functions.invoke('verify-payment', { body: { sessionId } });
        } catch (e) {
          console.error('Payment verification:', e);
        }
        const product = getCurrentProduct();
        if (product) {
          window.history.replaceState({}, '', '/gcse');
          setTimeout(() => { window.location.href = `/s/${product.slug}/premium`; }, 1500);
        }
      };
      verify();
    }
  }, [searchParams]);

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
      if (!labels[key]) {
        labels[key] = p.subject.replace(/\b\w/g, c => c.toUpperCase());
      }
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

  // Auto-select first board
  useEffect(() => {
    if (!examBoard && boardsForSubject.length > 0) {
      setExamBoard(boardsForSubject[0]);
    }
  }, [examBoard, boardsForSubject]);

  useEffect(() => {
    if (!searchParams.get('payment_success')) {
      window.scrollTo(0, 0);
    }
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

  const formatBoard = (b: string, subjectKey?: string) => {
    if (b === 'edexcel igcse') return 'Edexcel IGCSE';
    if (b === 'cie') return 'CIE';
    if (b === 'aqa') return 'AQA';
    if (b === 'ocr') return 'OCR';
    if (b === 'edexcel') return 'Edexcel';
    if (b === 'wjec') return 'WJEC';
    if (b === 'sqa') return 'SQA';
    return b.toUpperCase();
  };

  const hasSubjects = allSubjects.length > 0;
  const currentProduct = getCurrentProduct();

  return (
    <div className="min-h-screen font-sans relative">
      <SEOHead title="Choose Your GCSE A* AI Subject" description="Compare A* AI plans for GCSE revision. AI-powered tutoring for all GCSE subjects." canonical="https://astarai.co.uk/gcse" />
      {theme === 'dark' && !isMobile && <FlowFieldBackground color="#a855f7" trailOpacity={0.04} particleCount={400} />}
      <div className="relative z-10">
        <Header showNavLinks />

        <main className="pt-0 pb-8 px-4 sm:px-8 lg:px-10 max-w-6xl mx-auto text-center relative z-10">
          {/* Subject & Board Selection */}
          <ScrollReveal delay={0.1}>
            {/* Desktop */}
            <div className="hidden md:flex flex-col items-center gap-6 mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-0 flex-nowrap">
                <span className="self-center">Choose your GCSE</span>
                <img src={currentLogo} alt="A* AI" className={`h-16 md:h-20 inline-block -mx-2 md:-mx-3 ${theme === 'dark' ? '-translate-y-1 md:-translate-y-1.5' : ''}`} />
                <span className="self-center">Subject</span>
              </h1>

              {hasSubjects && (
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
              )}
            </div>

            {/* Mobile */}
            {hasSubjects && (
              <div className="md:hidden sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 flex items-start mb-8">
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
              </div>
            )}
          </ScrollReveal>

          {!hasSubjects ? null : (
            <>
              {/* Subject Feature Grid with inline board dropdown */}
              <ScrollReveal delay={0.2}>
                <div id="pricing">
                  <SubjectFeatureGrid
                    subject={subject}
                    subjectLabel={subjectLabels[subject] || subject}
                    examBoard={examBoard}
                    formattedBoard={formatBoard(examBoard, subject)}
                    hasAccess={hasProductAccess}
                    subscriptionPaymentType={subscriptionPaymentType}
                    onCtaClick={() => hasProductAccess ? handlePremiumClick() : handleFreeClick()}
                    boards={boardsForSubject}
                    onBoardChange={setExamBoard}
                  />
                </div>
              </ScrollReveal>
            </>
          )}
        </main>

        {/* Mobile: Founder Section + testimonials */}
        {hasSubjects && (
          <div className="md:hidden">
            {currentProduct && (
              <div className="relative">
                <DynamicFounderSection productId={currentProduct.id} subjectLabel={subjectLabels[subject] || subject} />
              </div>
            )}
            <div className="relative py-12 px-4">
              <h3 className="text-xl font-bold text-center mb-6">Loved by students across the UK ⬇️</h3>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                {homeTestimonials.slice(0, 3).map((t, i) => (
                  <div key={i} className="bg-card rounded-3xl p-5 shadow-card border border-border/30">
                    <p className="text-foreground leading-relaxed text-base">{t.text}</p>
                    <div className="flex items-center gap-3 mt-4">
                      {t.image && <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover object-[center_20%]" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Founder Section + Testimonials marquee */}
        {hasSubjects && (
          <div className="hidden md:block">
            {currentProduct && (
              <div className="relative">
                <DynamicFounderSection productId={currentProduct.id} subjectLabel={subjectLabels[subject] || subject} />
              </div>
            )}
            <div className="relative">
              <TestimonialsSection title="Loved by students across the UK ⬇️" testimonials={homeTestimonials.map(t => ({
                author: { name: t.name, handle: t.role, avatar: t.image },
                text: `"${t.text}"`
              }))} />
            </div>
          </div>
        )}

        {/* CTA Button */}
        {hasSubjects && (
          <div className="py-12 md:py-16 px-4 md:px-8 flex justify-center">
            <button
              onClick={handleFreeClick}
              className="px-10 py-5 rounded-2xl text-white font-bold text-lg md:text-xl bg-gradient-brand glow-brand hover:opacity-90 transition-opacity"
            >
              Let's get you started on {formatBoard(examBoard, subject)} {subjectLabels[subject] || subject} →
            </button>
          </div>
        )}

        {!user && (
          <ScrollReveal className="px-8 max-w-4xl mx-auto mt-12 mb-12 relative">
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

        {/* Footer */}
        <footer className="py-16 px-8 text-center border-t border-border/30 relative">
          <ScrollReveal className="max-w-4xl mx-auto">
            <p className="text-muted-foreground mb-6">
              Your AI-powered GCSE revision coach
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
              <Link to="/gcse" className="text-gradient-brand hover:opacity-80 transition-opacity">Plans</Link>
              <span>•</span>
              <Link to="/#faq" className="text-gradient-brand hover:opacity-80 transition-opacity">FAQs</Link>
              <span>•</span>
              <Link to="/login" className="text-gradient-brand hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
              <span>•</span>
              <Link to="/contact" className="text-gradient-brand hover:opacity-80 transition-opacity">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Secure checkout via Stripe • Your chats stay private
            </p>
            <div className="flex justify-center items-center gap-4">
              <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram size={24} />
              </a>
              <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
              </a>
              <a href="https://www.youtube.com/@a_star_ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube size={24} />
              </a>
              <a href="https://www.linkedin.com/company/astar-ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin size={24} />
              </a>
              <p className="text-sm text-muted-foreground">
                © 2025 A* AI
              </p>
            </div>
          </ScrollReveal>
        </footer>
      </div>
    </div>
  );
};
