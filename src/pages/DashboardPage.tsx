import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
// import logo from '@/assets/logo.png';

export const DashboardPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();

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
      <Header showNavLinks />
      
      <div className="py-8 px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            Welcome to <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-10" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered revision dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Version Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎓 Free Version
              </CardTitle>
              <CardDescription>
                Access basic A* AI features with 2 years of past papers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ 2 years of past papers</li>
                <li>✓ Basic GPT responses</li>
                <li>✓ Spec-aligned questions</li>
              </ul>
              <Button variant="outline" size="lg" asChild className="w-full">
                <Link to="/free-version">Launch Free Version</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Deluxe Version Card */}
          <Card className={profile?.is_premium ? 'border-primary bg-primary/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Deluxe Plan — £19.99 (One-Time, Lifetime Access)
                {profile?.is_premium && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {profile?.is_premium 
                  ? 'Access all deluxe features and content'
                  : 'Upgrade for full access to A* AI features'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ All Edexcel A-Level Economics A past papers (Paper 1, 2 & 3, 2017–2023)</li>
                <li>✓ Official examiner mark schemes</li>
                <li>✓ Trained on full exam technique + essay structures</li>
                <li>✓ Complete specification coverage</li>
                <li>✓ Step-by-step diagram guidance (every diagram from AD/AS to buffer stocks)</li>
                <li>✓ Application + model essay examples</li>
              </ul>
              
              {profile?.is_premium ? (
                <Button variant="brand" size="lg" asChild className="w-full">
                  <Link to="/premium">Launch Deluxe Version</Link>
                </Button>
              ) : (
                <Button 
                  variant="brand" 
                  size="lg" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      console.log('Starting premium upgrade process...');
                      const { supabase } = await import('@/integrations/supabase/client');
                      
                      // Get current session
                      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                      if (sessionError || !sessionData.session) {
                        console.error('No active session:', sessionError);
                        alert('Please log in again to upgrade to premium.');
                        return;
                      }

                      console.log('Creating checkout session...');
                      const { data, error } = await supabase.functions.invoke('create-checkout', {
                        headers: {
                          Authorization: `Bearer ${sessionData.session.access_token}`,
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
                  Upgrade to Deluxe
                </Button>
              )}
            </CardContent>
          </Card>
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
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile?.is_premium 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.is_premium ? 'Deluxe' : 'Free'}
                  </span>
                  {profile?.subscription_tier && (
                    <span className="text-sm text-muted-foreground">
                      ({profile.subscription_tier})
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
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
          <p className="text-sm text-muted-foreground">
            © A* AI
          </p>
        </div>
      </footer>
    </div>
  );
};