import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { ChevronDown, Check, Star, Instagram } from 'lucide-react';
import lucyImage from '/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png';
import jamesImage from '/lovable-uploads/f742f39f-8b1f-456c-b2f6-b8d660792c74.png';
import hannahImage from '/lovable-uploads/c9b3bf59-2df9-461f-a0ee-b47e9f0bad36.png';
import amiraImage from '@/assets/amira-lse.jpg';
import matanImage from '@/assets/matan-g.png';
import alexandruImage from '@/assets/alexandru-leoca.png';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { checkProductAccess } from '@/lib/productAccess';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestimonialsSection } from '@/components/ui/testimonials-with-marquee';
import { FounderSection } from '@/components/ui/founder-section';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { ScreenshotTestimonials } from '@/components/ui/screenshot-testimonials';
import { LatestFeaturesSection } from '@/components/LatestFeaturesSection';
import { FlowFieldBackground } from '@/components/ui/flow-field-background';
import { SubjectPlanSelector } from '@/components/SubjectPlanSelector';

type Subject = 'economics' | 'computer-science' | 'physics' | 'chemistry' | 'psychology' | 'mathematics';
type ExamBoard = 'edexcel' | 'aqa' | 'cie' | 'ocr';

export const ComparePage = () => {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldCheckout = searchParams.get('checkout') === 'true';
  const isMobile = useIsMobile();

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

  const subjectLabels: Record<Subject, string> = {
    'economics': 'Economics',
    'computer-science': 'Computer Science',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'psychology': 'Psychology',
    'mathematics': 'Mathematics'
  };

  const getPricing = () => {
    return { monthly: '£6.99', lifetime: '£24.99', monthlyStrike: '£12.99', lifetimeStrike: '£49.99' };
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

  useEffect(() => {
    if (window.location.hash === '#testimonials') {
      setTimeout(() => {
        const testimonialsSection = document.getElementById('testimonials');
        if (testimonialsSection) {
          testimonialsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (loading || !shouldCheckout || !user) return;
    if (profile?.is_premium) {
      navigate('/premium');
    } else {
      handlePremiumClick();
    }
  }, [shouldCheckout, user, profile?.is_premium, loading, navigate]);

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

  const pricing = getPricing();

  return (
    <div className="min-h-screen font-sans relative">
      <SEOHead title="Choose Your A* AI Plan | A-Level Economics, Computer Science & Physics" description="Compare A* AI plans for A-Level revision. Economics (Edexcel, AQA, CIE), Computer Science (OCR) & Physics (OCR). Free to start." canonical="https://astarai.co.uk/compare" />
      {theme === 'dark' && !isMobile && <FlowFieldBackground color="#a855f7" trailOpacity={0.04} particleCount={400} />}
      <div className="relative z-10">
        <Header showNavLinks />
        

        <main className="py-8 px-4 sm:px-8 max-w-5xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h1 className="text-2xl md:text-4xl font-bold mb-8 flex items-center justify-center gap-0 md:gap-0 flex-nowrap">
              <span className="self-center">Choose Your</span>
              <img src={currentLogo} alt="A* AI" className={`h-16 sm:h-20 md:h-24 inline-block -mx-2 md:-mx-3 ${theme === 'dark' ? '-translate-y-1 md:-translate-y-1.5' : ''}`} />
              <span className="self-center">Subject</span>
            </h1>
          </ScrollReveal>

          {/* Subject & Board Selection */}
          <ScrollReveal delay={0.1}>
            {/* Desktop: Connected toggle group + board dropdown on same line */}
            <div className="hidden md:flex items-center justify-center gap-4 mb-12">
              <div className="inline-flex rounded-full border border-border bg-background p-1.5 gap-1">
                {(['economics', 'computer-science', 'physics', 'chemistry', 'psychology', 'mathematics'] as Subject[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSubject(s);
                      if (s === 'economics' || s === 'mathematics') setExamBoard('edexcel');
                      else if (s === 'chemistry' || s === 'psychology') setExamBoard('aqa');
                      else setExamBoard('ocr');
                    }}
                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                      subject === s
                        ? 'bg-gradient-brand text-white'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {subjectLabels[s]}
                  </button>
                ))}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-6 py-2 text-sm font-medium border border-border bg-background text-foreground transition-all flex items-center gap-2 hover:bg-muted">
                    {examBoard === 'cie' ? 'CIE' : examBoard === 'aqa' ? 'AQA' : examBoard === 'ocr' ? 'OCR' : 'Edexcel'}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                  {(subject === 'economics'
                    ? (['edexcel', 'aqa', 'cie'] as ExamBoard[])
                    : subject === 'mathematics'
                    ? (['edexcel'] as ExamBoard[])
                    : subject === 'chemistry' || subject === 'psychology'
                    ? (['aqa'] as ExamBoard[])
                    : (['ocr'] as ExamBoard[])
                  ).map(b => (
                    <DropdownMenuItem key={b} className="cursor-pointer hover:bg-muted" onClick={() => setExamBoard(b)}>
                      {b === 'cie' ? 'CIE' : b === 'aqa' ? 'AQA' : b === 'ocr' ? 'OCR' : 'Edexcel'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile: Two dropdown buttons */}
            <div className="md:hidden sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 flex items-center justify-center gap-3 mb-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-brand text-white flex items-center gap-2 glow-brand">
                    {subjectLabels[subject]}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                  {(['economics', 'computer-science', 'physics', 'chemistry', 'psychology', 'mathematics'] as Subject[]).map(s => (
                    <DropdownMenuItem key={s} className="cursor-pointer hover:bg-muted" onClick={() => {
                      setSubject(s);
                      if (s === 'economics' || s === 'mathematics') setExamBoard('edexcel');
                      else if (s === 'chemistry' || s === 'psychology') setExamBoard('aqa');
                      else setExamBoard('ocr');
                    }}>
                      {subjectLabels[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-5 py-2.5 text-sm font-semibold border border-border bg-background text-foreground flex items-center gap-2 hover:bg-muted">
                    {examBoard === 'cie' ? 'CIE' : examBoard === 'aqa' ? 'AQA' : examBoard === 'ocr' ? 'OCR' : 'Edexcel'}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50 rounded-lg shadow-elevated">
                  {(subject === 'economics'
                    ? (['edexcel', 'aqa', 'cie'] as ExamBoard[])
                    : subject === 'mathematics'
                    ? (['edexcel'] as ExamBoard[])
                    : subject === 'chemistry' || subject === 'psychology'
                    ? (['aqa'] as ExamBoard[])
                    : (['ocr'] as ExamBoard[])
                  ).map(b => (
                    <DropdownMenuItem key={b} className="cursor-pointer hover:bg-muted" onClick={() => setExamBoard(b)}>
                      {b === 'cie' ? 'CIE' : b === 'aqa' ? 'AQA' : b === 'ocr' ? 'OCR' : 'Edexcel'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ScrollReveal>

          {/* Single Horizontal Plan Card - "The Plan" */}
          <ScrollReveal delay={0.2}>
            <div id="pricing" className="max-w-3xl mx-auto mb-12">
              <div className="bg-muted/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-border/50 shadow-elevated text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left: Features */}
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">{hasProductAccess ? "You're Deluxe!" : "The Plan"}</h2>
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
                        <span>Image upload & {subject === 'economics' ? (examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : 'CIE') : subject === 'mathematics' ? 'Edexcel' : subject === 'chemistry' || subject === 'psychology' ? 'AQA' : 'OCR'} analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Covers entire {subject === 'economics' ? (examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : 'CIE') : subject === 'mathematics' ? 'Edexcel' : subject === 'chemistry' || subject === 'psychology' ? 'AQA' : 'OCR'} specification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Personalised revision plans</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
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
        </main>

        {/* Mobile: Founder Section first, then stacked testimonials */}
        <div className="md:hidden">
          <div className="relative">
            {(subject === 'economics' || subject === 'computer-science' || subject === 'physics' || subject === 'chemistry' || subject === 'mathematics') && <FounderSection subject={subject} examBoard={examBoard} />}
          </div>
          
          <div className="relative py-12 px-4">
            <h3 className="text-xl font-bold text-center mb-6">Loved by sixth formers across the UK ⬇️</h3>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <div className="bg-card rounded-3xl p-5 shadow-card border border-border/30">
                <p className="text-foreground leading-relaxed text-base">A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src={matanImage} alt="Matan G" className="w-10 h-10 rounded-full object-cover object-[center_20%]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">Matan G</p>
                    <p className="text-sm text-muted-foreground truncate">Year 13 Student</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-3xl p-5 shadow-card border border-border/30">
                <p className="text-foreground leading-relaxed text-base">Convinced my econ teacher to buy it and use it in our lessons🫡 Showed it to him and he was shocked</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src={alexandruImage} alt="Alexandru Leoca" className="w-10 h-10 rounded-full object-cover object-[center_20%]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">Alexandru Leoca</p>
                    <p className="text-sm text-muted-foreground truncate">Year 12</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-3xl p-5 shadow-card border border-border/30">
                <p className="text-foreground leading-relaxed text-base">I used an early version of A* AI before its official launch. In those final weeks before the exam it was a lifesaver helping me match my knowledge to exact mark schemes helping me achieve A*s in Econ, Maths and Politics.</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src="/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png" alt="Sina Naderi" className="w-10 h-10 rounded-full object-cover object-[center_20%]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">Sina Naderi</p>
                    <p className="text-sm text-muted-foreground truncate">BA Economics, Cambridge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Founder Section then Testimonials marquee */}
        <div className="hidden md:block">
          <div className="relative">
            {(subject === 'economics' || subject === 'computer-science' || subject === 'physics' || subject === 'chemistry' || subject === 'mathematics') && <FounderSection subject={subject} examBoard={examBoard} />}
          </div>

          <div className="relative">
            <TestimonialsSection title="Loved by sixth formers across the UK ⬇️" testimonials={[{
              author: { name: "Lucy W", handle: "Year 12", avatar: lucyImage },
              text: "\"I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩\""
            }, {
              author: { name: "James W", handle: "LSE", avatar: jamesImage },
              text: "\"A* AI actually got me that A* in the end - helping me get 90% overall in all three papers. The live application feature is sick\""
            }, {
              author: { name: "Matan G", handle: "Year 13", avatar: matanImage },
              text: "\"A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.\""
            }, {
              author: { name: "Amira", handle: "LSE Offer Holder", avatar: amiraImage },
              text: "\"I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant.\""
            }]} />
          </div>
        </div>

        {/* Latest Features Section */}
        <section className="py-8 md:py-16 px-4 md:px-8 relative">
          <ScrollReveal>
            <h2 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-12">
              <div className="flex flex-nowrap items-center justify-center gap-1 md:gap-2">
                <span>Check out our</span>
                <span className="text-gradient-brand">latest</span>
                <span>features</span>
              </div>
            </h2>
          </ScrollReveal>
          <LatestFeaturesSection subject={subject} />
        </section>

        {/* Screenshot Testimonials */}
        <div className="relative">
          <ScreenshotTestimonials />
        </div>

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
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={currentLogo} alt="A* AI" className="h-12 sm:h-14" />
              <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram size={20} />
              </a>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Your AI-powered A-Level revision coach
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
              <Link to="/compare" className="text-gradient-brand hover:opacity-80 transition-opacity">Plans</Link>
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
