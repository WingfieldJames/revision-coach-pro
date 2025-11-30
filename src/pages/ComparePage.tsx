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

export const ComparePage = () => {
  const { user, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldCheckout = searchParams.get('checkout') === 'true';
  const [productType, setProductType] = useState<'edexcel' | 'aqa'>('edexcel');
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Product IDs
  const PRODUCT_IDS = {
    edexcel: '6dc19d53-8a88-4741-9528-f25af97afb21',
    aqa: '17ade690-8c44-4961-83b5-0edf42a9faea'
  };

  // Check product access when user or productType changes
  useEffect(() => {
    const checkAccess = async () => {
      console.log('Checking access for user:', user?.id, 'productType:', productType);
      
      if (!user || loading) {
        console.log('No user or still loading, setting hasAccess to false');
        setHasProductAccess(false);
        return;
      }

      setCheckingAccess(true);
      const productSlug = productType === 'aqa' ? 'aqa-economics' : 'edexcel-economics';
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
  }, [user, productType, loading]);

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
    if (!user) {
      // NOT logged in → Login → Free version
      const redirectPath = productType === 'aqa' ? 'aqa-free-version' : 'free-version';
      window.location.href = `/login?redirect=${redirectPath}`;
      return;
    }
    
    // LOGGED in (any user) → Free version
    const freePath = productType === 'aqa' ? '/aqa-free-version' : '/free-version';
    window.location.href = freePath;
  };

  const handlePremiumClick = async () => {
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
      const premiumPath = productType === 'aqa' ? '/aqa-premium' : '/premium';
      window.location.href = premiumPath;
      return;
    }

    // User doesn't have access → Stripe checkout
    console.log('User does not have access, starting checkout');
    try {
      console.log('Creating checkout session with payment type:', paymentType, 'for product:', productType);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error('Session error:', sessionError);
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }

      const productId = PRODUCT_IDS[productType];
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
      
      <main className="py-8 px-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8 flex items-center justify-center gap-3 flex-wrap">
          Choose Your 
          <img 
            src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" 
            alt="A* AI" 
            className="h-8 sm:h-10 md:h-12 inline-block" 
          />
          Plan
        </h1>

        {/* Combined Toggle - Subject Dropdown + Payment Dropdown + Product Toggle */}
        <div className="flex justify-center mb-12">
          <div className="border border-border p-1.5 rounded-full bg-transparent flex items-center gap-1">
            {/* Subject Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-white text-foreground hover:opacity-90 transition-all flex items-center gap-2">
                  Economics
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50">
                <DropdownMenuItem className="cursor-pointer hover:bg-muted">
                  Economics
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-default opacity-50">
                  Maths (coming soon)
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-default opacity-50">
                  Computer Science (coming soon)
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-default opacity-50">
                  Chemistry (coming soon)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Payment Type Dropdown - Hidden on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex rounded-full px-6 py-2.5 text-sm font-semibold bg-white text-foreground hover:opacity-90 transition-all items-center gap-2">
                  {paymentType === 'lifetime' ? 'Lifetime (save 67% yearly)' : 'Monthly'}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50">
                <DropdownMenuItem 
                  onClick={() => setPaymentType('monthly')}
                  className="cursor-pointer hover:bg-muted"
                >
                  Monthly
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setPaymentType('lifetime')}
                  className="cursor-pointer hover:bg-muted"
                >
                  Lifetime (save 67% yearly)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Product Type Toggle */}
            <ToggleGroup 
              type="single" 
              value={productType} 
              onValueChange={(value) => value && setProductType(value as 'edexcel' | 'aqa')}
              className="flex items-center gap-1"
            >
              <ToggleGroupItem 
                value="edexcel" 
                className="rounded-full px-6 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all"
              >
                Edexcel
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="aqa" 
                className="rounded-full px-6 py-2.5 text-sm font-semibold data-[state=on]:bg-gradient-brand data-[state=on]:text-white data-[state=off]:text-foreground data-[state=off]:bg-transparent hover:bg-muted transition-all"
              >
                AQA
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Free Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left">
            <h2 className="text-2xl font-semibold mb-6">🎓 Free Plan - £0</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on the 2024-2023 {productType === 'edexcel' ? 'Edexcel Economics A' : 'AQA Economics'} past papers (P1–P3)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Spec-aligned responses and quick practice
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Basic help only (no mark-scheme feedback or structures)
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
            >
              Try free now
            </Button>
          </div>

          {/* Deluxe Plan - Edexcel */}
          {productType === 'edexcel' && (
            <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left border-2 border-primary">
              {paymentType === 'monthly' ? (
                <>
                  <h2 className="text-2xl font-semibold mb-2">🔥 Deluxe Plan — <span className="line-through text-red-500">£9.99</span> £4.99 (Monthly Access)</h2>
                  <p className="text-sm text-muted-foreground mb-6">Cancel anytime • Active while subscription is active</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-2">🔥 Deluxe Plan — <span className="line-through text-red-500">£39.99</span> £19.99 (Lifetime Access)</h2>
                  <p className="text-sm text-muted-foreground mb-6">One-time payment • Lifetime access</p>
                </>
              )}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  AI trained on all Edexcel Economics A past papers (2017-2024, P1-P3)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Official examiner mark schemes built-in
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Trained on full exam technique + essay structures
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Covers the entire Edexcel specification
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Step-by-step diagram guidance (AD/AS → buffer stocks)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Application bank + model essay examples
                </li>
              </ul>
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                onClick={handlePremiumClick}
              >
                {hasProductAccess ? 'Launch Deluxe' : 'Unlock Deluxe'}
              </Button>
            </div>
          )}

          {/* Deluxe Plan - AQA */}
          {productType === 'aqa' && (
            <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left border-2 border-primary">
              {paymentType === 'monthly' ? (
                <>
                  <h2 className="text-2xl font-semibold mb-2">🔥 Deluxe Plan — <span className="line-through text-red-500">£9.99</span> £4.99 (Monthly Access)</h2>
                  <p className="text-sm text-muted-foreground mb-6">Cancel anytime • Active while subscription is active</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-2">🔥 Deluxe Plan — <span className="line-through text-red-500">£39.99</span> £19.99 (Lifetime Access)</h2>
                  <p className="text-sm text-muted-foreground mb-6">One-time payment • Lifetime access</p>
                </>
              )}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  AI trained on all AQA past papers (2017-2024, P1-P3)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Official examiner mark schemes built-in
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Trained on full exam technique + essay structures
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Covers the entire AQA specification
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Step-by-step diagram guidance (AD/AS → buffer stocks)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 font-bold mr-2">✓</span>
                  Application bank + model essay examples
                </li>
              </ul>
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                onClick={handlePremiumClick}
              >
                {hasProductAccess ? 'Launch Deluxe' : 'Unlock Deluxe'}
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-6">
          {paymentType === 'monthly' 
            ? 'Monthly billing • Cancel anytime • Secure checkout via Stripe'
            : 'One-time payment • Lifetime access • Secure checkout via Stripe'
          }
        </p>
      </main>

      {/* Features Section */}
      <section className="py-16 px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>How</span>
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-6 md:h-8" />
            <span>helps you revise</span>
            <span className="bg-gradient-brand bg-clip-text text-transparent">smarter</span>
          </div>
        </h2>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
          {/* Laptop Image */}
          <div className="flex-1 text-center">
            <img src="/lovable-uploads/57ee3730-ed40-48ca-a81c-378b769729de.png" alt="Laptop mockup" className="max-w-full h-auto mx-auto" />
            <InteractiveHoverButton 
              text="Choose your plan →" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="pointer-events-auto text-base px-6 py-3 w-[220px] bg-white text-foreground border border-border mt-8"
            />
          </div>

          {/* Features */}
          <div className="flex-1 space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📄 Past Paper Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Search and retrieve real past paper questions by topic, paper, or command word. 
                A* AI understands how Edexcel organises questions, making practice fully targeted.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📰 Live Updated Application</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                The latest examples and case studies — formatted specifically for 25-mark essays 
                in Paper 1 and 2. Updated regularly from global economic news to match Edexcel expectations.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📈 A* Technique</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                From 2 markers to 25 markers, A* AI knows exactly how to structure every response. It guides you through KAA, chains of reasoning and evaluation — so you can write those top band answers that examiners love
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 md:py-20 bg-muted w-full">
        <div className="px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl text-center mb-12 flex items-center justify-center gap-2">
            Loved by sixth formers across the UK ⬇️
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0"></div>
              <div>
                <strong className="text-base text-card-foreground">Lucy W - Year 12</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩"
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={jamesImage} alt="James profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">James W - LSE</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "A* AI actually got me that A* in the end - helping me get 90% overall in all three papers. The live application feature is sick "
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={hannahImage} alt="Hannah profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">Elliot S - Year 13</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "No fluff, no wasted time — A* AI helped me revise with focus. Being able to search by topic and command word made past paper practice 10x more efficient."
                </p>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-card p-6 rounded-2xl shadow-card flex gap-4 w-full">
              <img src={amiraImage} alt="Amira profile" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              <div>
                <strong className="text-base text-card-foreground">Amira – LSE Offer Holder</strong>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  "I used A* AI the month before exams and smashed both Paper 1 and 2. It's way more helpful than YouTube — everything's structured and instant."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <div className="px-8 max-w-4xl mx-auto mt-12 mb-12">
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
        </div>
      )}

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
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
        </div>
      </footer>
    </div>
  );
};