import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import lucyImage from '/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png';
import jamesImage from '/lovable-uploads/f742f39f-8b1f-456c-b2f6-b8d660792c74.png';
import hannahImage from '/lovable-uploads/c9b3bf59-2df9-461f-a0ee-b47e9f0bad36.png';
import amiraImage from '@/assets/amira-lse.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { checkProductAccess } from '@/lib/productAccess';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Instagram } from 'lucide-react';
import { TestimonialsSection } from '@/components/ui/testimonials-with-marquee';
import { FounderSection } from '@/components/ui/founder-section';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

type Subject = 'economics' | 'chemistry' | 'computer-science' | 'maths';
type ExamBoard = 'edexcel' | 'aqa' | 'cie' | 'ocr';

export const ComparePage = () => {
  const { user, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldCheckout = searchParams.get('checkout') === 'true';
  const [subject, setSubject] = useState<Subject>('economics');
  const [examBoard, setExamBoard] = useState<ExamBoard>('edexcel');
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Product IDs mapped by slug
  const PRODUCT_IDS: Record<string, string> = {
    'edexcel-economics': '6dc19d53-8a88-4741-9528-f25af97afb21',
    'aqa-economics': '17ade690-8c44-4961-83b5-0edf42a9faea',
    'cie-economics': '9a710cf9-0523-4c1f-82c6-0e02b19087e5',
    'ocr-chemistry': '6c32e2fb-4c1d-4166-b3e8-70c22e1c90c8',
    'ocr-computer-science': '5d05830b-de7b-4206-8f49-6d3695324eb6'
  };

  // Get current product slug based on subject and exam board
  const getCurrentProductSlug = () => {
    if (subject === 'economics') {
      if (examBoard === 'aqa') return 'aqa-economics';
      if (examBoard === 'cie') return 'cie-economics';
      return 'edexcel-economics';
    }
    if (subject === 'chemistry') return 'ocr-chemistry';
    if (subject === 'computer-science') return 'ocr-computer-science';
    return null;
  };

  // Check if current subject is coming soon
  const isComingSoon = subject === 'chemistry' || subject === 'computer-science' || subject === 'maths';

  // Subject display names
  const subjectLabels: Record<Subject, string> = {
    'economics': 'Economics',
    'chemistry': 'Chemistry',
    'computer-science': 'Computer Science',
    'maths': 'Maths'
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
        const { hasAccess } = await checkProductAccess(user.id, productSlug);
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

  // Scroll to top when component mounts, or to testimonials if hash is present
  useEffect(() => {
    if (window.location.hash === '#testimonials') {
      // Small delay to ensure the component is fully rendered
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
    
    if (!user) {
      // NOT logged in → Login → Free version
      const redirectPath = examBoard === 'aqa' ? 'aqa-free-version' : examBoard === 'cie' ? 'cie-free-version' : 'free-version';
      window.location.href = `/login?redirect=${redirectPath}`;
      return;
    }
    
    // LOGGED in (any user) → Free version
    const freePath = examBoard === 'aqa' ? '/aqa-free-version' : examBoard === 'cie' ? '/cie-free-version' : '/free-version';
    window.location.href = freePath;
  };

  const handlePremiumClick = async () => {
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
      const premiumPath = examBoard === 'aqa' ? '/aqa-premium' : examBoard === 'cie' ? '/cie-premium' : '/premium';
      window.location.href = premiumPath;
      return;
    }

    // User doesn't have access → Stripe checkout
    console.log('User does not have access, starting checkout');
    try {
      const productSlug = getCurrentProductSlug();
      console.log('Creating checkout session with payment type:', paymentType, 'for product:', productSlug);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
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

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: {
          paymentType,
          productId,
          affiliateCode,
        },
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

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header showNavLinks />
      
      {/* Instagram Follow Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-3 px-4 text-center text-white">
        <p className="text-sm font-medium flex items-center justify-center gap-2 flex-wrap">
          <Instagram className="h-4 w-4" />
          Please follow us on{' '}
          <a 
            href="https://www.instagram.com/a.star.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-semibold hover:opacity-80 transition-opacity"
          >
            Instagram
          </a>
          {' '}to stay updated on the latest features, deals and events!
        </p>
      </div>
      
      <main className="py-8 px-8 max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h1 className="text-4xl font-bold mb-8 flex items-center justify-center gap-3 flex-wrap">
            Choose Your 
            <img 
              src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" 
              alt="A* AI" 
              className="h-8 sm:h-10 md:h-12 inline-block" 
            />
            Plan
          </h1>
        </ScrollReveal>

        {/* Combined Toggle - Subject Dropdown + Exam Board Toggle */}
        <ScrollReveal delay={0.1}>
          <div className="flex justify-center mb-12">
            <div className="border border-border p-1.5 rounded-full bg-transparent flex items-center gap-1">
              {/* Subject Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-white text-foreground hover:opacity-90 transition-all flex items-center gap-2">
                    {subjectLabels[subject]}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border border-border z-50">
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => { setSubject('economics'); setExamBoard('edexcel'); }}
                  >
                    Economics
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => { setSubject('chemistry'); setExamBoard('ocr'); }}
                  >
                    Chemistry
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => { setSubject('computer-science'); setExamBoard('ocr'); }}
                  >
                    Computer Science
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-default text-muted-foreground">
                    Maths (coming soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Exam Board Toggle - Different options based on subject */}
              {subject === 'economics' ? (
                <ToggleGroup 
                  type="single" 
                  value={examBoard} 
                  onValueChange={(value) => value && setExamBoard(value as ExamBoard)}
                  className="flex items-center gap-1"
                >
                  <ToggleGroupItem 
                    value="edexcel" 
                    className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all"
                  >
                    Edexcel
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="aqa" 
                    className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all"
                  >
                    AQA
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="cie" 
                    className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all"
                  >
                    CIE
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : (
                <div className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-brand text-white">
                  OCR
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Desktop: 3 columns, Mobile: stack */}
        <StaggerContainer className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Free Plan */}
          <StaggerItem className="bg-muted p-6 lg:p-10 rounded-xl max-w-md lg:max-w-md w-full shadow-card text-left">
            <h2 className="text-xl lg:text-2xl font-semibold mb-6">🎓 Free Plan</h2>
            {isComingSoon ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </>
            ) : (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2">£0</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Forever free</p>
              </>
            )}
            <ul className="space-y-4 mb-8 text-sm lg:text-base">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on 2024-2023 {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA Economics' : examBoard === 'cie' ? 'CIE Economics' : `OCR ${subjectLabels[subject]}`} past papers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Spec-aligned responses and quick practice
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Basic help only (no mark-scheme feedback)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                5 free prompts daily
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              onClick={handleFreeClick}
              disabled={isComingSoon}
            >
              {isComingSoon ? 'Coming Soon' : 'Try free now'}
            </Button>
          </StaggerItem>

          {/* Monthly Plan - Desktop only */}
          <StaggerItem className="hidden lg:block bg-muted p-6 lg:p-10 rounded-xl max-w-md lg:max-w-md w-full shadow-card text-left">
            <h2 className="text-xl lg:text-2xl font-semibold mb-2">🔥 Deluxe Monthly</h2>
            {isComingSoon ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </>
            ) : (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2"><span className="line-through text-red-500 text-lg lg:text-xl">£9.99</span> £4.99<span className="text-base lg:text-lg font-normal">/mo</span></p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Cancel anytime</p>
              </>
            )}
            <ul className="space-y-4 mb-8 text-sm lg:text-base">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on all {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : `OCR ${subjectLabels[subject]}`} past papers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Official examiner mark schemes built-in
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Trained on full A* exam technique + essay structures
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Covers the entire {examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : 'OCR'} specification
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Image uploads supported
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Unlimited daily prompts
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              onClick={() => {
                setPaymentType('monthly');
                handlePremiumClick();
              }}
              disabled={isComingSoon}
            >
              {isComingSoon ? 'Coming Soon' : hasProductAccess ? 'Launch Deluxe' : 'Get Monthly'}
            </Button>
          </StaggerItem>

          {/* Lifetime Plan */}
          <StaggerItem className="bg-muted p-6 lg:p-10 rounded-xl max-w-md lg:max-w-md w-full shadow-card text-left border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs lg:text-sm font-semibold px-4 py-1.5 rounded-full">
              {isComingSoon ? 'COMING SOON' : 'BEST VALUE'}
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold mb-2">🔥 Deluxe Lifetime</h2>
            {isComingSoon ? (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2 text-muted-foreground">Coming Soon</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">Stay tuned!</p>
              </>
            ) : (
              <>
                <p className="text-3xl lg:text-4xl font-bold mb-2"><span className="line-through text-red-500 text-lg lg:text-xl">£49.99</span> £24.99</p>
                <p className="text-sm lg:text-base text-muted-foreground mb-6">One-time payment • Save 50%</p>
              </>
            )}
            <ul className="space-y-4 mb-8 text-sm lg:text-base">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on all {examBoard === 'edexcel' ? 'Edexcel Economics A' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : `OCR ${subjectLabels[subject]}`} past papers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Official examiner mark schemes built-in
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Trained on full A* exam technique + essay structures
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Covers the entire {examBoard === 'edexcel' ? 'Edexcel' : examBoard === 'aqa' ? 'AQA' : examBoard === 'cie' ? 'CIE' : 'OCR'} specification
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Image uploads supported
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Unlimited daily prompts
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              onClick={() => {
                setPaymentType('lifetime');
                handlePremiumClick();
              }}
              disabled={isComingSoon}
            >
              {isComingSoon ? 'Coming Soon' : hasProductAccess ? 'Launch Deluxe' : 'Get Lifetime'}
            </Button>
          </StaggerItem>
        </StaggerContainer>
        
        <ScrollReveal delay={0.3}>
          <p className="text-sm text-muted-foreground mt-6">
            Secure checkout via Stripe • Your chats stay private
          </p>
        </ScrollReveal>
      </main>

      <TestimonialsSection
        title="Loved by sixth formers across the UK ⬇️"
        testimonials={[
          {
            author: {
              name: "Lucy W",
              handle: "Year 12",
              avatar: lucyImage
            },
            text: "\"I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩\""
          },
          {
            author: {
              name: "James W",
              handle: "LSE",
              avatar: jamesImage
            },
            text: "\"A* AI actually got me that A* in the end - helping me get 90% overall in all three papers. The live application feature is sick\""
          },
          {
            author: {
              name: "Elliot S",
              handle: "Year 13",
              avatar: hannahImage
            },
            text: "\"No fluff, no wasted time — A* AI helped me revise with focus. Being able to search by topic and command word made past paper practice 10x more efficient.\""
          },
          {
            author: {
              name: "Amira",
              handle: "LSE Offer Holder",
              avatar: amiraImage
            },
            text: "\"I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant.\""
          }
        ]}
      />

      {/* Founder Section - Only show for Economics */}
      {subject === 'economics' && <FounderSection />}

      <section className="py-16 px-8">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span>How</span>
              <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-6 md:h-8" />
              <span>helps you revise</span>
              <span className="bg-gradient-brand bg-clip-text text-transparent">smarter</span>
            </div>
          </h2>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
          {/* Laptop Image */}
          <ScrollReveal direction="left" className="flex-1 text-center">
            <img src="/lovable-uploads/57ee3730-ed40-48ca-a81c-378b769729de.png" alt="Laptop mockup" className="max-w-full h-auto mx-auto" />
            <InteractiveHoverButton 
              text="Choose your plan →" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="pointer-events-auto text-base px-6 py-3 w-[220px] bg-white text-foreground border border-border mt-8"
            />
          </ScrollReveal>

          {/* Features */}
          <StaggerContainer className="flex-1 space-y-6">
            <StaggerItem className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📄 Past Paper Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Search and retrieve real past paper questions by topic, paper, or command word. 
                A* AI understands how Edexcel organises questions, making practice fully targeted.
              </p>
            </StaggerItem>
            
            <StaggerItem className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📰 Live Updated Application</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                The latest examples and case studies — formatted specifically for 25-mark essays 
                in Paper 1 and 2. Updated regularly from global economic news to match Edexcel expectations.
              </p>
            </StaggerItem>
            
            <StaggerItem className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📈 A* Technique</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                From 2 markers to 25 markers, A* AI knows exactly how to structure every response. It guides you through KAA, chains of reasoning and evaluation — so you can write those top band answers that examiners love
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {!user && (
        <ScrollReveal className="px-8 max-w-4xl mx-auto mt-12 mb-12">
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
        </ScrollReveal>
      )}

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
            <p className="text-sm text-muted-foreground">
              © A* AI
            </p>
          </div>
        </ScrollReveal>
      </footer>
    </div>
  );
};
