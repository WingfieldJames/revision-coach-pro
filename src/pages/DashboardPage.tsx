import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

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
            Welcome to <img src={logo} alt="A* AI" className="h-10" />
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

          {/* Premium Version Card */}
          <Card className={profile?.is_premium ? 'border-primary bg-primary/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Premium Version
                {profile?.is_premium && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {profile?.is_premium 
                  ? 'Access all premium features and content'
                  : 'Upgrade for full access to A* AI features'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ 10+ years of past papers</li>
                <li>✓ Official mark schemes</li>
                <li>✓ Built-in exam technique</li>
                <li>✓ Application and essay examples</li>
                <li>✓ Full Notion study guide</li>
              </ul>
              
              {profile?.is_premium ? (
                <Button variant="brand" size="lg" asChild className="w-full">
                  <Link to="/premium">Launch Premium Version</Link>
                </Button>
              ) : (
                <Button variant="brand" size="lg" asChild className="w-full">
                  <Link to="/compare">Upgrade to Premium</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

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
                    {profile?.is_premium ? 'Premium' : 'Free'}
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
    </div>
  );
};