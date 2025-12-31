import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
// import logo from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2, ExternalLink, Instagram, ChevronDown } from 'lucide-react';
import { checkProductAccess, ProductAccess } from '@/lib/productAccess';

export const DashboardPage = () => {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [productType, setProductType] = useState<'edexcel' | 'aqa' | 'cie'>(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('preferred-exam-board');
    return (saved === 'aqa' || saved === 'edexcel' || saved === 'cie') ? saved : 'edexcel';
  });
  
  // Track product-specific access for each exam board
  const [productAccess, setProductAccess] = useState<Record<string, ProductAccess>>({});
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check product access for all exam boards when user loads
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        setCheckingAccess(true);
        const [edexcelAccess, aqaAccess, cieAccess] = await Promise.all([
          checkProductAccess(user.id, 'edexcel-economics'),
          checkProductAccess(user.id, 'aqa-economics'),
          checkProductAccess(user.id, 'cie-economics'),
        ]);
        setProductAccess({
          'edexcel': edexcelAccess,
          'aqa': aqaAccess,
          'cie': cieAccess,
        });
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user]);

  // Save preference whenever it changes
  useEffect(() => {
    localStorage.setItem('preferred-exam-board', productType);
  }, [productType]);

  // Check for payment success and verify with Stripe
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    
    if (paymentSuccess === 'true' && sessionId) {
      // Verify payment with Stripe and update user status
      const verifyPayment = async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId }
          });
          
          if (data?.success) {
            // Refresh profile to get updated premium status
            setTimeout(() => {
              refreshProfile();
            }, 1000);
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
        }
      };
      
      verifyPayment();
      
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, refreshProfile]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Button variant="brand" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Dashboard | A* AI – A-Level Economics Revision"
        description="Access your A* AI dashboard. Launch your free or Deluxe AI revision coach for Edexcel, AQA & CIE Economics."
        canonical="https://astarai.co.uk/dashboard"
      />
      <Header showNavLinks />
      
      <div className="py-6 px-8 max-w-4xl mx-auto">
        {/* Product Type Toggle */}
        <div className="flex justify-center mb-8">
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

            {/* Exam Board Toggle */}
            <ToggleGroup 
              type="single" 
              value={productType} 
              onValueChange={(value) => value && setProductType(value as 'edexcel' | 'aqa' | 'cie')}
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
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 justify-center mb-6">
          {/* Free Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left">
            <h2 className="text-2xl font-semibold mb-6">🎓 Free Plan - £0</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on the 2025-2024 {productType === 'edexcel' ? 'Edexcel Economics A' : productType === 'aqa' ? 'AQA Economics' : 'CIE Economics'} past papers (P1–P3)
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
              asChild
            >
              <Link to={productType === 'edexcel' ? '/free-version' : productType === 'aqa' ? '/aqa-free-version' : '/cie-free-version'}>Launch free</Link>
            </Button>
          </div>

          {/* Deluxe Plan */}
          <div className={`bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left ${productAccess[productType]?.hasAccess ? 'border-2 border-primary' : 'border-2 border-primary'}`}>
            <h2 className="text-2xl font-semibold mb-6">
              🔥 Deluxe Plan {productType === 'edexcel' ? '(Edexcel)' : productType === 'aqa' ? '(AQA)' : '(CIE)'} — <span className="line-through text-red-500">£49.99</span> £24.99 (Lifetime Access)
              {productAccess[productType]?.hasAccess && (
                <span className="block text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full w-fit mt-2">
                  ACTIVE
                </span>
              )}
            </h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                AI trained on all {productType === 'edexcel' ? 'Edexcel Economics A' : productType === 'aqa' ? 'AQA' : 'CIE'} past papers (2017-2025, P1-P3)
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
                Covers the entire {productType === 'edexcel' ? 'Edexcel' : productType === 'aqa' ? 'AQA' : 'CIE'} specification
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Image uploads supported
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Step-by-step diagram guidance (AD/AS → buffer stocks) + application bank
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Unlimited daily prompts
              </li>
            </ul>
            
            {productAccess[productType]?.hasAccess ? (
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                asChild
              >
                <Link to={productType === 'edexcel' ? '/premium' : productType === 'aqa' ? '/aqa-premium' : '/cie-premium'}>Launch Deluxe Version</Link>
              </Button>
            ) : (
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                disabled={checkingAccess}
                onClick={async () => {
                  try {
                    console.log('Starting premium upgrade process for', productType);
                    const { supabase } = await import('@/integrations/supabase/client');
                    
                    // Get current session
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !sessionData.session) {
                      console.error('No active session:', sessionError);
                      alert('Please log in again to upgrade to premium.');
                      return;
                    }

                    console.log('Creating checkout session...');
                    
                    // Get affiliate code if available
                    const affiliateCode = getValidAffiliateCode();
                    if (affiliateCode) {
                      console.log('Including affiliate code:', affiliateCode);
                    }
                    
                    // Map product type to product slug
                    const productSlug = productType === 'edexcel' ? 'edexcel-economics' 
                      : productType === 'aqa' ? 'aqa-economics' 
                      : 'cie-economics';
                    
                    const { data, error } = await supabase.functions.invoke('create-checkout', {
                      headers: {
                        Authorization: `Bearer ${sessionData.session.access_token}`,
                      },
                      body: {
                        affiliateCode,
                        productSlug,
                      },
                    });
                    
                    if (error) {
                      console.error('Error creating checkout session:', error);
                      alert('There was an error starting the checkout process. Please try again.');
                      return;
                    }

                    if (data?.url) {
                      console.log('Redirecting to Stripe checkout:', data.url);
                      
                      // Direct redirect - most reliable approach
                      window.location.href = data.url;
                    } else {
                      console.error('No checkout URL received');
                      alert('Unable to start checkout process. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error creating checkout session:', error);
                    alert('There was an error starting the checkout process. Please try again.');
                  }
                }}
              >
                {checkingAccess ? 'Checking access...' : 'Upgrade to Deluxe'}
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-6">
          One-time payment • Lifetime access • Secure checkout via Stripe
        </p>

        {/* Account Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Subscription Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  {productAccess['edexcel']?.hasAccess && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Edexcel Economics Deluxe
                    </span>
                  )}
                  {productAccess['aqa']?.hasAccess && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      AQA Economics Deluxe
                    </span>
                  )}
                  {productAccess['cie']?.hasAccess && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      CIE Economics Deluxe
                    </span>
                  )}
                  {!productAccess['edexcel']?.hasAccess && !productAccess['aqa']?.hasAccess && !productAccess['cie']?.hasAccess && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {profile?.subscription_end && (
                <div>
                  <p className="text-sm font-medium">Subscription Ends</p>
                  <p className="text-muted-foreground">
                    {new Date(profile.subscription_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2025 A* AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};