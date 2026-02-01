import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, Star, Instagram } from 'lucide-react';
import lucyImage from '/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png';
import jamesImage from '/lovable-uploads/f742f39f-8b1f-456c-b2f6-b8d660792c74.png';
import hannahImage from '/lovable-uploads/c9b3bf59-2df9-461f-a0ee-b47e9f0bad36.png';
import amiraImage from '@/assets/amira-lse.jpg';
import matanImage from '@/assets/matan-g.png';
import { useAuth } from '@/contexts/AuthContext';
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
type Subject = 'economics' | 'computer-science' | 'physics';
type ExamBoard = 'edexcel' | 'aqa' | 'cie' | 'ocr';
export const ComparePage = () => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldCheckout = searchParams.get('checkout') === 'true';
  const [subject, setSubject] = useState<Subject>(() => {
    const saved = localStorage.getItem('preferred-subject');
    return saved === 'economics' || saved === 'computer-science' || saved === 'physics' ? saved as Subject : 'economics';
  });
  const [examBoard, setExamBoard] = useState<ExamBoard>(() => {
    const savedSubject = localStorage.getItem('preferred-subject');
    const saved = localStorage.getItem('preferred-exam-board');
    // Only use saved exam board if it matches the subject
    if (savedSubject === 'computer-science' || savedSubject === 'physics') {
      return 'ocr';
    }
    return saved === 'edexcel' || saved === 'aqa' || saved === 'cie' ? saved as ExamBoard : 'edexcel';
  });
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Product IDs mapped by slug
  const PRODUCT_IDS: Record<string, string> = {
    'edexcel-economics': '6dc19d53-8a88-4741-9528-f25af97afb21',
    'aqa-economics': '17ade690-8c44-4961-83b5-0edf42a9faea',
    'cie-economics': '9a710cf9-0523-4c1f-82c6-0e02b19087e5',
    'ocr-computer-science': '5d05830b-de7b-4206-8f49-6d3695324eb6',
    'ocr-physics': 'ecd5978d-3bf4-4b9c-993f-30b7f3a0f197'
  };

  // Get current product slug based on subject and exam board
  const getCurrentProductSlug = () => {
    if (subject === 'economics') {
      if (examBoard === 'aqa') return 'aqa-economics';
      if (examBoard === 'cie') return 'cie-economics';
      return 'edexcel-economics';
    }
    if (subject === 'computer-science') return 'ocr-computer-science';
    if (subject === 'physics') return 'ocr-physics';
    return null;
  };

  // Check if current subject is coming soon (affects all plans)
  const isComingSoon = false;

  // Check if Deluxe is coming soon (Free may still be available)
  const isDeluxeComingSoon = false; // Physics is now live!

  // Subject display names
  const subjectLabels: Record<Subject, string> = {
    'economics': 'Economics',
    'computer-science': 'Computer Science',
    'physics': 'Physics'
  };

  // Check product access when user or subject/examBoard changes
  useEffect(() => {
    const checkAccess = async () => {
      const productSlug = getCurrentProductSlug();
      console.log('Checking access for user:', user?.id, 'subject:', subject, 'examBoard:', examBoard);
      if (!user || loading || !productSlug || isComingSoon) {
        console.log('No user, still loading, or coming soon - setting hasAccess to false');
        setHasProductAccess(false);
        return;
      }
      setCheckingAccess(true);
      console.log('Checking access for product slug:', productSlug);
      try {
        const {
          hasAccess
        } = await checkProductAccess(user.id, productSlug);
        console.log('Access check result:', hasAccess);
        setHasProductAccess(hasAccess);
      } catch (error) {
        console.error('Error checking product access:', error);
        setHasProductAccess(false);
      }
      setCheckingAccess(false);
    };
    checkAccess();
  }, [user, subject, examBoard, loading, isComingSoon]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('preferred-subject', subject);
    localStorage.setItem('preferred-exam-board', examBoard);
  }, [subject, examBoard]);

  // Scroll to top when component mounts, or to testimonials if hash is present
  useEffect(() => {
    if (window.location.hash === '#testimonials') {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        const testimonialsSection = document.getElementById('testimonials');
        if (testimonialsSection) {
          testimonialsSection.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Auto-trigger checkout if redirected from login
  useEffect(() => {
    // Wait for auth to finish loading before making decision
    if (loading || !shouldCheckout || !user) return;

    // If user is already premium, redirect to premium page
    if (profile?.is_premium) {
      console.log('User is already premium, redirecting to premium version');
      navigate('/premium');
    } else {
      // User is not premium, trigger checkout
      console.log('Auto-triggering checkout for logged-in user');
      handlePremiumClick();
    }
  }, [shouldCheckout, user, profile?.is_premium, loading, navigate]);
  const handleFreeClick = async () => {
    if (isComingSoon) return; // Don't allow clicks for coming soon subjects

    // Determine the free version path based on subject and exam board
    const getFreePath = () => {
      if (subject === 'computer-science') return '/ocr-cs-free-version';
      if (subject === 'physics') return '/ocr-physics-free-version';
      if (examBoard === 'aqa') return '/aqa-free-version';
      if (examBoard === 'cie') return '/cie-free-version';
      return '/free-version';
    };
    if (!user) {
      // NOT logged in → Login → Free version
      const redirectPath = getFreePath().replace('/', '');
      window.location.href = `/login?redirect=${redirectPath}`;
      return;
    }

    // LOGGED in (any user) → Free version
    window.location.href = getFreePath();
  };
  const handlePremiumClick = async (selectedPaymentType: 'monthly' | 'lifetime' = paymentType) => {
    if (isComingSoon) return; // Don't allow clicks for coming soon subjects

    console.log('Button clicked! User:', user ? 'logged in' : 'not logged in', 'hasProductAccess:', hasProductAccess);
    if (!user) {
      // NOT logged in → Login → Stripe
      console.log('Redirecting to login');
      window.location.href = '/login?redirect=stripe';
      return;
    }

    // Check if user has access to current product
    if (hasProductAccess) {
      // User has access → redirect to premium page
      console.log('User has access, redirecting to premium page');
      const premiumPath = subject === 'computer-science' ? '/ocr-cs-premium' : subject === 'physics' ? '/ocr-physics-premium' : examBoard === 'aqa' ? '/aqa-premium' : examBoard === 'cie' ? '/cie-premium' : '/premium';
      window.location.href = premiumPath;
      return;
    }

    // User doesn't have access → Stripe checkout
    console.log('User does not have access, starting checkout with payment type:', selectedPaymentType);
    try {
      const productSlug = getCurrentProductSlug();
      console.log('Creating checkout session with payment type:', paymentType, 'for product:', productSlug);
      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        console.error('Session error:', sessionError);
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }
      const productId = productSlug ? PRODUCT_IDS[productSlug] : null;
      console.log('Using product ID:', productId);

      // Get affiliate code if available
      const affiliateCode = getValidAffiliateCode();
      if (affiliateCode) {
        console.log('Including affiliate code:', affiliateCode);
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: {
          paymentType: selectedPaymentType,
          productId,
          affiliateCode
        }
      });
      if (error) {
        console.error('Checkout error:', error);
        const msg = (error as any).message || String(error);

        // Check if it's an authentication error
        if (msg.includes('not_authenticated') || msg.includes('401')) {
          alert('Your session has expired. Please log in again to continue.');
          window.location.href = '/login?redirect=stripe';
          return;
        }
        alert(`Failed to create checkout session: ${msg}`);
        return;
      }
      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No checkout URL in response:', data);
        alert('Unable to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in handlePremiumClick:', error);
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  return <div className="min-h-screen bg-background font-sans relative">
      <SEOHead title="Choose Your A* AI Plan | A-Level Economics, Computer Science & Physics" description="Compare A* AI plans for A-Level revision. Economics (Edexcel, AQA, CIE), Computer Science (OCR) & Physics (OCR). Free tier or Deluxe with full past paper training. £24.99 one-time." canonical="https://astarai.co.uk/compare" />
      <FlowFieldBackground color="#a855f7" trailOpacity={0.04} particleCount={400} />
      <Header showNavLinks />
      
      <main className="py-8 px-8 max-w-4xl mx-auto text-center relative z-10">
        <ScrollReveal>
          <h1 className="text-2xl md:text-4xl font-bold mb-8 flex items-center justify-center gap-2 md:gap-3 flex-nowrap">
            Choose Your 
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8 sm:h-10 md:h-12 inline-block" />
            Plan
          </h1>
        </ScrollReveal>

        {/* Combined Toggle - Subject + Exam Board */}
        <ScrollReveal delay={0.1}>
          <div className="flex justify-center mb-12">
            {/* Mobile: Dropdown for subject */}
            <div className="md:hidden border border-border p-1.5 rounded-full bg-transparent flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-white text-foreground hover:opacity-90 transition-all flex items-center gap-2">
                    {subjectLabels[subject]}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50">
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => {
                  setSubject('economics');
                  setExamBoard('edexcel');
                }}>
                    Economics
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => {
                  setSubject('computer-science');
                  setExamBoard('ocr');
                }}>
                    Computer Science
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-muted" onClick={() => {
                  setSubject('physics');
                  setExamBoard('ocr');
                }}>
                    Physics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Exam Board Toggle for mobile */}
              {subject === 'economics' ? <ToggleGroup type="single" value={examBoard} onValueChange={value => value && setExamBoard(value as ExamBoard)} className="flex items-center gap-1">
                  <ToggleGroupItem value="edexcel" className="rounded-full px-4 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    Edexcel
                  </ToggleGroupItem>
                  <ToggleGroupItem value="aqa" className="rounded-full px-4 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    AQA
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cie" className="rounded-full px-4 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    CIE
                  </ToggleGroupItem>
                </ToggleGroup> : subject === 'computer-science' || subject === 'physics' ? <div className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-brand text-white">
                  OCR
                </div> : null}
            </div>

            {/* Tablet/Desktop: All toggles in one row */}
            <div className="hidden md:flex border border-border p-1.5 rounded-full bg-transparent items-center">
              {/* Subject Toggle - Fixed width container to prevent shifting */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <ToggleGroup type="single" value={subject} onValueChange={value => {
                if (value) {
                  setSubject(value as Subject);
                  setExamBoard(value === 'economics' ? 'edexcel' : 'ocr');
                }
              }} className="flex items-center gap-1">
                  <ToggleGroupItem value="economics" className="rounded-full w-[110px] py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    Economics
                  </ToggleGroupItem>
                  <ToggleGroupItem value="computer-science" className="rounded-full w-[150px] py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    Computer Science
                  </ToggleGroupItem>
                  <ToggleGroupItem value="physics" className="rounded-full w-[80px] py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all">
                    Physics
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1" />
              </div>

              {/* Exam Board Toggle - Fixed width container to prevent shifting */}
              <div className="w-[200px] flex items-center gap-1">
                <ToggleGroup type="single" value={examBoard} onValueChange={value => value && setExamBoard(value as ExamBoard)} className="flex items-center gap-1 w-full">
                {subject === 'economics' ? <>
                      <ToggleGroupItem value="edexcel" className="rounded-full flex-1 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-colors">
                        Edexcel
                      </ToggleGroupItem>
                      <ToggleGroupItem value="aqa" className="rounded-full flex-1 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-colors">
                        AQA
                      </ToggleGroupItem>
                      <ToggleGroupItem value="cie" className="rounded-full flex-1 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-colors">
                        CIE
                      </ToggleGroupItem>
                    </> : subject === 'computer-science' || subject === 'physics' ? <>
                      <ToggleGroupItem value="ocr" className="rounded-full flex-1 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-colors">
                        OCR
                      </ToggleGroupItem>
                      <div className="rounded-full flex-1 py-2.5 text-sm font-semibold text-muted-foreground bg-transparent text-center cursor-default">
                        AQA
                      </div>
                      <div className="rounded-full flex-1 py-2.5 text-sm font-semibold text-muted-foreground bg-transparent text-center cursor-default">
                        Edexcel
                      </div>
                    </> : null}
                </ToggleGroup>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Desktop: 3 columns, Mobile: stack */}
        <StaggerContainer className="flex flex-col lg:flex-row gap-6 justify-center w-full max-w-6xl mx-auto">
          {/* Free Plan */}
          <StaggerItem className="bg-muted p-6 lg:p-10 rounded-xl w-full lg:flex-1 shadow-card text-left flex flex-col">
            <h2 className="text-xl lg:text-2xl font-semibold mb-6">🎓 Free Plan</h2>
            {isComingSoon ? <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </> : <>
                <p className="text-3xl lg:text-4xl font-bold mb-2">£0</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Forever free</p>
              </>}
            <ul className="space-y-4 mb-8 text-sm lg:text-base flex-1">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">AI trained on 2025-2024 {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA Economics' : examBoard === 'cie' ? 'CIE Economics' : `OCR ${subjectLabels[subject]}`} past papers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Spec-aligned responses and quick practice</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Basic help only (no mark-scheme feedback)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">3 free prompts daily</span>
              </li>
            </ul>
            <Button variant="brand" size="lg" className="w-full mt-auto" onClick={handleFreeClick} disabled={isComingSoon}>
              {isComingSoon ? 'Coming Soon' : 'Try free now'}
            </Button>
          </StaggerItem>

          {/* Monthly Plan - Desktop only */}
          <StaggerItem className="hidden lg:flex bg-muted p-6 lg:p-10 rounded-xl w-full lg:flex-1 shadow-card text-left flex-col">
            <h2 className="text-xl lg:text-2xl font-semibold mb-2 whitespace-nowrap"> 💎 Deluxe Monthly</h2>
            {isDeluxeComingSoon ? <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </> : <>
                <p className="text-3xl lg:text-4xl font-bold mb-2"><span className="line-through text-red-500 text-lg lg:text-xl">£9.99</span> £4.99<span className="text-base lg:text-lg font-normal">/mo</span></p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Cancel anytime</p>
              </>}
            <ul className="space-y-4 mb-8 text-sm lg:text-base flex-1">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">AI trained on all {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : `OCR ${subjectLabels[subject]}`} past papers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Official examiner mark schemes built-in</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Trained on full A* exam technique + essay structures</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Covers the entire {examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : 'OCR'} specification</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Image uploads supported</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Unlimited daily prompts</span>
              </li>
            </ul>
            <Button variant="brand" size="lg" className="w-full mt-auto" onClick={() => handlePremiumClick('monthly')} disabled={isDeluxeComingSoon}>
              {isDeluxeComingSoon ? 'Coming Soon' : hasProductAccess ? 'Launch Deluxe' : 'Get Monthly'}
            </Button>
          </StaggerItem>

          {/* Exam Season Pass */}
          <StaggerItem className="bg-muted p-6 lg:p-10 rounded-xl w-full lg:flex-1 shadow-card text-left border-2 border-primary relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs lg:text-sm font-semibold px-4 py-1.5 rounded-full">
              {isDeluxeComingSoon ? 'COMING SOON' : 'BEST VALUE'}
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold mb-2 whitespace-nowrap"> 💎 Exam Season Pass</h2>
            {isDeluxeComingSoon ? <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </> : <>
                <p className="text-3xl lg:text-4xl font-bold mb-2"><span className="line-through text-red-500 text-lg lg:text-xl">£49.99</span> £24.99</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">One-time payment • Expires 30th June 2026</p>
              </>}
            <ul className="space-y-4 mb-8 text-sm lg:text-base flex-1">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">AI trained on all {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : `OCR ${subjectLabels[subject]}`} past papers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Official examiner mark schemes built-in</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Trained on full A* exam technique + essay structures</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Covers the entire {examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : 'OCR'} specification</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Image uploads supported</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2 shrink-0">✓</span>
                <span className="line-clamp-2">Unlimited daily prompts</span>
              </li>
            </ul>
            <Button variant="brand" size="lg" className="w-full mt-auto" onClick={() => handlePremiumClick('lifetime')} disabled={isDeluxeComingSoon}>
              {isDeluxeComingSoon ? 'Coming Soon' : hasProductAccess ? 'Launch Deluxe' : 'Get Season Pass'}
            </Button>
          </StaggerItem>
        </StaggerContainer>
        
        <ScrollReveal delay={0.3}>
          <p className="text-xs md:text-sm text-muted-foreground mt-6 whitespace-nowrap">
            Secure checkout via Stripe • Your chats stay private
          </p>
        </ScrollReveal>
      </main>

      <TestimonialsSection title="Loved by sixth formers across the UK ⬇️" testimonials={[{
      author: {
        name: "Lucy W",
        handle: "Year 12",
        avatar: lucyImage
      },
      text: "\"I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩\""
    }, {
      author: {
        name: "James W",
        handle: "LSE",
        avatar: jamesImage
      },
      text: "\"A* AI actually got me that A* in the end - helping me get 90% overall in all three papers. The live application feature is sick\""
    }, {
      author: {
        name: "Matan G",
        handle: "Year 13",
        avatar: matanImage
      },
      text: "\"A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.\""
    }, {
      author: {
        name: "Amira",
        handle: "LSE Offer Holder",
        avatar: amiraImage
      },
      text: "\"I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant.\""
    }]} />

      {/* Founder Section - Show for Economics, Computer Science, and Physics */}
      {(subject === 'economics' || subject === 'computer-science' || subject === 'physics') && <FounderSection subject={subject} examBoard={examBoard} />}

      {/* Latest Features Section */}
      <section className="py-8 md:py-16 px-4 md:px-8">
        <ScrollReveal>
          <h2 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-12">
            <div className="flex flex-nowrap items-center justify-center gap-1 md:gap-2">
              <span>Check out our</span>
              <span className="bg-gradient-brand bg-clip-text text-transparent">latest</span>
              <span>features</span>
            </div>
          </h2>
        </ScrollReveal>

        <LatestFeaturesSection subject={subject} />
      </section>

      {/* Screenshot Testimonials */}
      <ScreenshotTestimonials />

      {!user && <ScrollReveal className="px-8 max-w-4xl mx-auto mt-12 mb-12">
          <div className="p-6 bg-secondary rounded-lg">
            <p className="text-muted-foreground mb-4 text-center">
              New to A* AI? Create an account to track your progress and access premium features.
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
        </ScrollReveal>}

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <ScrollReveal className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={20} />
            </a>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Contact</Link>
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
    </div>;
};