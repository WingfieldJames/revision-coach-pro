import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2, ExternalLink, Instagram, ChevronDown, AlertCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { checkProductAccess, ProductAccess } from '@/lib/productAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Subject = 'economics' | 'computer-science' | 'physics' | 'chemistry' | 'psychology';
type ExamBoard = 'edexcel' | 'aqa' | 'cie' | 'ocr';

export const DashboardPage = () => {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [subject, setSubject] = useState<Subject>(() => {
    const saved = localStorage.getItem('preferred-subject');
    return (saved === 'economics' || saved === 'computer-science' || saved === 'physics' || saved === 'chemistry' || saved === 'psychology') ? saved as Subject : 'economics';
  });
  const [productType, setProductType] = useState<ExamBoard>(() => {
    const savedSubject = localStorage.getItem('preferred-subject');
    const saved = localStorage.getItem('preferred-exam-board');
    // Only use saved exam board if it matches the subject
    if (savedSubject === 'computer-science' || savedSubject === 'physics') {
      return 'ocr';
    }
    if (savedSubject === 'chemistry' || savedSubject === 'psychology') {
      return 'aqa';
    }
    return (saved === 'edexcel' || saved === 'aqa' || saved === 'cie') ? saved as ExamBoard : 'edexcel';
  });
  
  // Track product-specific access for each exam board
  const [productAccess, setProductAccess] = useState<Record<string, ProductAccess>>({});
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<Record<string, any>>({});
  
  // Save preferences to localStorage and reset exam board when subject changes
  useEffect(() => {
    localStorage.setItem('preferred-subject', subject);
    if (subject === 'economics') {
      // Only reset if current board is not valid for economics
      if (productType === 'ocr') {
        setProductType('edexcel');
      }
    } else if (subject === 'computer-science' || subject === 'physics') {
      setProductType('ocr');
    } else if (subject === 'chemistry' || subject === 'psychology') {
      setProductType('aqa');
    }
  }, [subject]);

  // Save exam board preference when it changes
  useEffect(() => {
    localStorage.setItem('preferred-exam-board', productType);
  }, [productType]);

  // Check product access for all exam boards when user loads
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        setCheckingAccess(true);
        const [edexcelAccess, aqaAccess, cieAccess, ocrCsAccess, ocrPhysicsAccess, aqaChemistryAccess, aqaPsychologyAccess] = await Promise.all([
          checkProductAccess(user.id, 'edexcel-economics'),
          checkProductAccess(user.id, 'aqa-economics'),
          checkProductAccess(user.id, 'cie-economics'),
          checkProductAccess(user.id, 'ocr-computer-science'),
          checkProductAccess(user.id, 'ocr-physics'),
          checkProductAccess(user.id, 'aqa-chemistry'),
          checkProductAccess(user.id, 'aqa-psychology'),
        ]);
        setProductAccess({
          'edexcel': edexcelAccess,
          'aqa': aqaAccess,
          'cie': cieAccess,
          'ocr': subject === 'physics' ? ocrPhysicsAccess : ocrCsAccess,
          'ocr-cs': ocrCsAccess,
          'ocr-physics': ocrPhysicsAccess,
          'aqa-chemistry': aqaChemistryAccess,
          'aqa-psychology': aqaPsychologyAccess,
        });
        
        // Fetch subscription details for monthly subscriptions
        const { data: subs } = await supabase
          .from('user_subscriptions')
          .select('*, products(name, slug)')
          .eq('user_id', user.id)
          .eq('active', true);
        
        if (subs) {
          const details: Record<string, any> = {};
          subs.forEach((sub: any) => {
            const slug = sub.products?.slug;
            if (slug) {
              // Map slugs to consistent keys
              let key = slug;
              if (slug === 'edexcel-economics') key = 'edexcel';
              else if (slug === 'aqa-economics') key = 'aqa';
              else if (slug === 'cie-economics') key = 'cie';
              else if (slug === 'ocr-computer-science') key = 'ocr-cs';
              else if (slug === 'ocr-physics') key = 'ocr-physics';
              else if (slug === 'aqa-chemistry') key = 'aqa-chemistry';
              else if (slug === 'aqa-psychology') key = 'aqa-psychology';
              details[key] = sub;
            }
          });
          setSubscriptionDetails(details);
        }
        
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user, subject]);

  // Cancel subscription handler
  const handleCancelSubscription = async (productKey: string) => {
    const sub = subscriptionDetails[productKey];
    if (!sub || sub.payment_type !== 'monthly') {
      toast.error('Only monthly subscriptions can be cancelled');
      return;
    }
    
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.')) {
      return;
    }
    
    setCancellingSubscription(productKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please log in again');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: { cancelAtPeriodEnd: true },
      });
      
      if (error) throw error;
      
      toast.success(data.message || 'Subscription cancelled successfully');
      
      // Refresh access
      refreshProfile();
      const [edexcelAccess, aqaAccess, cieAccess, ocrCsAccess, ocrPhysicsAccess, aqaChemistryAccess, aqaPsychologyAccess] = await Promise.all([
        checkProductAccess(user!.id, 'edexcel-economics'),
        checkProductAccess(user!.id, 'aqa-economics'),
        checkProductAccess(user!.id, 'cie-economics'),
        checkProductAccess(user!.id, 'ocr-computer-science'),
        checkProductAccess(user!.id, 'ocr-physics'),
        checkProductAccess(user!.id, 'aqa-chemistry'),
        checkProductAccess(user!.id, 'aqa-psychology'),
      ]);
      setProductAccess({
        'edexcel': edexcelAccess,
        'aqa': aqaAccess,
        'cie': cieAccess,
        'ocr-cs': ocrCsAccess,
        'ocr-physics': ocrPhysicsAccess,
        'aqa-chemistry': aqaChemistryAccess,
        'aqa-psychology': aqaPsychologyAccess,
      });
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setCancellingSubscription(null);
    }
  };

  // Save preference whenever it changes
  useEffect(() => {
    localStorage.setItem('preferred-exam-board', productType);
    localStorage.setItem('preferred-subject', subject);
  }, [productType, subject]);

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
                <button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-white/10 text-foreground hover:opacity-90 transition-all flex items-center gap-2">
                  {subject === 'economics' ? 'Economics' : subject === 'computer-science' ? 'Computer Science' : subject === 'physics' ? 'Physics' : subject === 'chemistry' ? 'Chemistry' : 'Psychology'}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50">
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSubject('economics')}
                >
                  Economics
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSubject('computer-science')}
                >
                  Computer Science
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSubject('physics')}
                >
                  Physics
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSubject('chemistry')}
                >
                  Chemistry
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSubject('psychology')}
                >
                  Psychology
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Exam Board Toggle - Changes based on subject */}
            {subject === 'economics' ? (
              <ToggleGroup 
                type="single" 
                value={productType} 
                onValueChange={(value) => value && setProductType(value as ExamBoard)}
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
            ) : subject === 'computer-science' || subject === 'physics' ? (
              <ToggleGroup 
                type="single" 
                value="ocr" 
                className="flex items-center gap-1"
              >
                <ToggleGroupItem 
                  value="ocr" 
                  className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold bg-gradient-brand !text-white"
                >
                  OCR
                </ToggleGroupItem>
              </ToggleGroup>
            ) : subject === 'chemistry' ? (
              <ToggleGroup 
                type="single" 
                value="aqa" 
                className="flex items-center gap-1"
              >
                <ToggleGroupItem 
                  value="aqa" 
                  className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold bg-gradient-brand !text-white"
                >
                  AQA
                </ToggleGroupItem>
              </ToggleGroup>
            ) : subject === 'psychology' ? (
              <ToggleGroup 
                type="single" 
                value="aqa" 
                className="flex items-center gap-1"
              >
                <ToggleGroupItem 
                  value="aqa" 
                  className="rounded-full px-4 sm:px-6 py-2.5 text-sm font-semibold bg-gradient-brand !text-white"
                >
                  AQA
                </ToggleGroupItem>
              </ToggleGroup>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 justify-center mb-6">
          {/* Free Plan */}
          <div className="bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left">
            <h2 className="text-2xl font-semibold mb-6">🎓 Free Plan - £0</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                {subject === 'economics' 
                  ? `AI trained on the 2025-2024 ${productType === 'edexcel' ? 'Edexcel Economics A' : productType === 'aqa' ? 'AQA Economics' : 'CIE Economics'} past papers (P1–P3)`
                  : subject === 'computer-science'
                  ? 'AI trained on the 2025-2024 OCR Computer Science past papers'
                  : subject === 'physics'
                  ? 'AI trained on the 2025-2024 OCR Physics past papers'
                  : subject === 'chemistry'
                  ? 'AI trained on the 2025-2024 AQA Chemistry past papers'
                  : 'AI trained on the 2025-2024 AQA Psychology past papers'
                }
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
                3 free prompts daily
              </li>
            </ul>
            <Button 
              variant="brand" 
              size="lg" 
              className="w-full"
              asChild
            >
              <Link to={
                subject === 'computer-science' 
                  ? '/ocr-cs-free-version'
                  : subject === 'physics'
                  ? '/ocr-physics-free-version'
                  : subject === 'chemistry'
                  ? '/aqa-chemistry-free-version'
                  : subject === 'psychology'
                  ? '/aqa-psychology-free-version'
                  : productType === 'edexcel' ? '/free-version' : productType === 'aqa' ? '/aqa-free-version' : '/cie-free-version'
              }>Launch free</Link>
            </Button>
          </div>

          {/* Deluxe Plan */}
          <div className={`bg-muted p-8 rounded-xl max-w-md w-full shadow-card text-left ${(subject === 'computer-science' ? productAccess['ocr-cs']?.hasAccess : subject === 'physics' ? productAccess['ocr-physics']?.hasAccess : subject === 'chemistry' ? productAccess['aqa-chemistry']?.hasAccess : subject === 'psychology' ? productAccess['aqa-psychology']?.hasAccess : productAccess[productType]?.hasAccess) ? 'border-2 border-primary' : 'border-2 border-primary'}`}>
            <h2 className="text-2xl font-semibold mb-2">
              💎 Exam Season Pass {subject === 'computer-science' ? '(OCR CS)' : subject === 'physics' ? '(OCR Physics)' : subject === 'chemistry' ? '(AQA Chemistry)' : subject === 'psychology' ? '(AQA Psychology)' : productType === 'edexcel' ? '(Edexcel)' : productType === 'aqa' ? '(AQA)' : '(CIE)'}
              {(subject === 'computer-science' ? productAccess['ocr-cs']?.hasAccess : subject === 'physics' ? productAccess['ocr-physics']?.hasAccess : subject === 'chemistry' ? productAccess['aqa-chemistry']?.hasAccess : subject === 'psychology' ? productAccess['aqa-psychology']?.hasAccess : productAccess[productType]?.hasAccess) && (
                <span className="block text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full w-fit mt-2">
                  ACTIVE
                </span>
              )}
            </h2>
            <p className="text-3xl font-bold mb-2">
              <span className="line-through text-red-500 text-lg">£49.99</span> £24.99
            </p>
            <p className="text-sm text-muted-foreground mb-6">One-time payment • Expires 30th June 2026</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                {subject === 'economics'
                  ? `AI trained on all ${productType === 'edexcel' ? 'Edexcel Economics A' : productType === 'aqa' ? 'AQA' : 'CIE'} past papers (2017-2025, P1-P3)`
                  : subject === 'computer-science'
                  ? 'AI trained on all OCR Computer Science past papers'
                  : subject === 'physics'
                  ? 'AI trained on all OCR Physics past papers'
                  : subject === 'chemistry'
                  ? 'AI trained on all AQA Chemistry past papers'
                  : 'AI trained on all AQA Psychology past papers'
                }
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
                Covers the entire {subject === 'economics' ? (productType === 'edexcel' ? 'Edexcel' : productType === 'aqa' ? 'AQA' : 'CIE') : subject === 'chemistry' || subject === 'psychology' ? 'AQA' : 'OCR'} specification
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Image uploads supported
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                {subject === 'economics' 
                  ? 'Step-by-step diagram guidance (AD/AS → buffer stocks) + application bank'
                  : subject === 'computer-science'
                  ? 'Step-by-step coding guidance + algorithm explanations'
                  : subject === 'physics'
                  ? 'Step-by-step calculation guidance + formula explanations'
                  : subject === 'chemistry'
                  ? 'Step-by-step mechanism guidance + calculation explanations'
                  : 'Step-by-step essay guidance + evaluation structures'
                }
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✓</span>
                Unlimited daily prompts
              </li>
            </ul>
            
            {(subject === 'computer-science' ? productAccess['ocr-cs']?.hasAccess : subject === 'physics' ? productAccess['ocr-physics']?.hasAccess : subject === 'chemistry' ? productAccess['aqa-chemistry']?.hasAccess : subject === 'psychology' ? productAccess['aqa-psychology']?.hasAccess : productAccess[productType]?.hasAccess) ? (
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                asChild
              >
                <Link to={
                  subject === 'computer-science' 
                    ? '/ocr-cs-premium' 
                    : subject === 'physics'
                    ? '/ocr-physics-premium'
                    : subject === 'chemistry'
                    ? '/aqa-chemistry-premium'
                    : subject === 'psychology'
                    ? '/aqa-psychology-premium'
                    : productType === 'edexcel' ? '/premium' : productType === 'aqa' ? '/aqa-premium' : '/cie-premium'
                }>Launch Deluxe Version</Link>
              </Button>
            ) : (
              <Button 
                variant="brand" 
                size="lg" 
                className="w-full"
                disabled={checkingAccess}
                onClick={async () => {
                  try {
                    console.log('Starting premium upgrade process for', subject === 'computer-science' ? 'ocr-computer-science' : productType);
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
                    const productSlug = subject === 'computer-science' 
                      ? 'ocr-computer-science'
                      : subject === 'physics'
                      ? 'ocr-physics'
                      : subject === 'chemistry'
                      ? 'aqa-chemistry'
                      : subject === 'psychology'
                      ? 'aqa-psychology'
                      : productType === 'edexcel' ? 'edexcel-economics' 
                        : productType === 'aqa' ? 'aqa-economics' 
                        : 'cie-economics';
                    
                    const { data, error } = await supabase.functions.invoke('create-checkout', {
                      headers: {
                        Authorization: `Bearer ${sessionData.session.access_token}`,
                      },
                      body: {
                        affiliateCode,
                        productSlug,
                        paymentType: 'lifetime', // Dashboard uses lifetime by default
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
                {checkingAccess ? 'Checking access...' : 'Get Season Pass'}
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-6">
          One-time payment • Expires 30th June 2026 • Secure checkout via Stripe
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
                <p className="text-sm font-medium mb-2">Subscription Status</p>
                <div className="space-y-3">
                  {(['edexcel', 'aqa', 'cie', 'ocr-cs', 'ocr-physics', 'aqa-chemistry', 'aqa-psychology'] as const).map((board) => {
                    const access = productAccess[board];
                    const sub = subscriptionDetails[board];
                    if (!access?.hasAccess) return null;
                    
                    const isMonthly = sub?.payment_type === 'monthly';
                    const boardName = {
                      'edexcel': 'Edexcel Economics',
                      'aqa': 'AQA Economics',
                      'cie': 'CIE Economics',
                      'ocr-cs': 'OCR Computer Science',
                      'ocr-physics': 'OCR Physics',
                      'aqa-chemistry': 'AQA Chemistry',
                      'aqa-psychology': 'AQA Psychology',
                    }[board];
                    
                    return (
                      <div key={board} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{boardName} Deluxe</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                              {isMonthly ? 'Monthly' : 'Lifetime'}
                            </span>
                            {isMonthly && sub?.subscription_end && (
                              <span className="text-xs text-muted-foreground">
                                Renews: {new Date(sub.subscription_end).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isMonthly && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelSubscription(board)}
                            disabled={cancellingSubscription === board}
                          >
                            {cancellingSubscription === board ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  
                  {!productAccess['edexcel']?.hasAccess && !productAccess['aqa']?.hasAccess && !productAccess['cie']?.hasAccess && !productAccess['ocr-cs']?.hasAccess && !productAccess['ocr-physics']?.hasAccess && !productAccess['aqa-chemistry']?.hasAccess && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Free
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={logo} alt="A* AI" className="h-12 sm:h-14" />
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