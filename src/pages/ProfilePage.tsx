import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Mail, Shield, AlertTriangle, Gift, Flame, Clock } from 'lucide-react';
import { StreakDisplay } from '@/components/StreakDisplay';
import { ReferAFriend } from '@/components/ReferAFriend';
import { ReviewDashboardSection } from '@/components/ReviewDashboardSection';
import { checkProductAccess, ProductAccess } from '@/lib/productAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [productAccess, setProductAccess] = React.useState<Record<string, ProductAccess>>({});
  const [subscriptionDetails, setSubscriptionDetails] = React.useState<Record<string, any>>({});
  const [cancellingSubscription, setCancellingSubscription] = React.useState<string | null>(null);
  const [cancelFlowOpen, setCancelFlowOpen] = React.useState(false);
  const [cancelFlowStep, setCancelFlowStep] = React.useState(0);
  const [cancelFlowBoard, setCancelFlowBoard] = React.useState<string | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [loadingAccess, setLoadingAccess] = React.useState(true);

  React.useEffect(() => {
    const loadAccess = async () => {
      if (!user) return;
      setLoadingAccess(true);
      const [edexcel, aqa, cie, ocrCs, ocrPhysics, aqaChem, aqaPsych, edexcelMaths] = await Promise.all([
        checkProductAccess(user.id, 'edexcel-economics'),
        checkProductAccess(user.id, 'aqa-economics'),
        checkProductAccess(user.id, 'cie-economics'),
        checkProductAccess(user.id, 'ocr-computer-science'),
        checkProductAccess(user.id, 'ocr-physics'),
        checkProductAccess(user.id, 'aqa-chemistry'),
        checkProductAccess(user.id, 'aqa-psychology'),
        checkProductAccess(user.id, 'edexcel-mathematics'),
      ]);
      setProductAccess({
        'edexcel': edexcel, 'aqa': aqa, 'cie': cie,
        'ocr-cs': ocrCs, 'ocr-physics': ocrPhysics,
        'aqa-chemistry': aqaChem, 'aqa-psychology': aqaPsych,
        'edexcel-maths': edexcelMaths,
      });

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('*, products(name, slug)')
        .eq('user_id', user.id)
        .eq('active', true);

      if (subs) {
        const details: Record<string, any> = {};
        subs.forEach((sub: any) => {
          const slug = sub.products?.slug;
          if (!slug) return;
          const keyMap: Record<string, string> = {
            'edexcel-economics': 'edexcel', 'aqa-economics': 'aqa', 'cie-economics': 'cie',
            'ocr-computer-science': 'ocr-cs', 'ocr-physics': 'ocr-physics',
            'aqa-chemistry': 'aqa-chemistry', 'aqa-psychology': 'aqa-psychology',
            'edexcel-mathematics': 'edexcel-maths',
          };
          const key = keyMap[slug] || slug;
          details[key] = sub;
        });
        setSubscriptionDetails(details);
      }
      setLoadingAccess(false);
    };
    loadAccess();
  }, [user]);

  const startCancelFlow = (productKey: string) => {
    setCancelFlowBoard(productKey);
    setCancelFlowStep(0);
    setCancelReason('');
    setCancelFlowOpen(true);
  };

  const confirmCancellation = async () => {
    if (!cancelFlowBoard) return;
    setCancellingSubscription(cancelFlowBoard);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { toast.error('Please log in again'); return; }
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { cancelAtPeriodEnd: true },
      });
      if (error) throw error;
      toast.success(data.message || 'Subscription cancelled — you keep access until the end of your billing period.');
      setCancelFlowOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel');
    } finally {
      setCancellingSubscription(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Button variant="brand" asChild><Link to="/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  const boardNames: Record<string, string> = {
    'edexcel': 'Edexcel Economics', 'aqa': 'AQA Economics', 'cie': 'CIE Economics',
    'ocr-cs': 'OCR Computer Science', 'ocr-physics': 'OCR Physics',
    'aqa-chemistry': 'AQA Chemistry', 'aqa-psychology': 'AQA Psychology',
    'edexcel-maths': 'Edexcel Mathematics',
  };

  const activeBoards = Object.keys(boardNames).filter(k => productAccess[k]?.hasAccess);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Profile | A* AI" description="Manage your A* AI profile, subscriptions, and study stats." canonical="https://astarai.co.uk/profile" />
      <Header showNavLinks />

      <div className="py-8 px-4 sm:px-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Account</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAccess ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Checking...
              </div>
            ) : activeBoards.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">No active subscriptions</p>
                <Button variant="brand" asChild><Link to="/compare">Browse Plans</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBoards.map(board => {
                  const sub = subscriptionDetails[board];
                  const isMonthly = sub?.payment_type === 'monthly';
                  return (
                    <div key={board} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <span className="font-medium">{boardNames[board]}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {sub?.payment_type === 'referral' ? 'Referral' : isMonthly ? 'Monthly' : 'Lifetime'}
                          </Badge>
                          <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">ACTIVE</Badge>
                          {sub?.subscription_end && (
                            <span className="text-xs text-muted-foreground">
                              {isMonthly ? 'Renews' : 'Expires'}: {new Date(sub.subscription_end).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isMonthly && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => startCancelFlow(board)}
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak & Spaced Review */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StreakDisplay />
          <ReviewDashboardSection />
        </div>

        {/* Referrals */}
        <ReferAFriend />
      </div>

      {/* Multi-step cancellation flow */}
      <Dialog open={cancelFlowOpen} onOpenChange={setCancelFlowOpen}>
        <DialogContent className="sm:max-w-md">
          {cancelFlowStep === 0 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Are you sure?
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Exams are just around the corner. Students who keep practising in the final weeks see the biggest grade improvements.
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-sm">Your study streak and progress will stop building</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Gift className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <p className="text-sm">You'll lose unlimited prompts, essay marking, and past papers</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm">The Exam Season Pass (£39.99 one-time) might be better value — no recurring charges</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="brand" className="flex-1" onClick={() => setCancelFlowOpen(false)}>
                    Keep Subscription
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => setCancelFlowStep(1)}>
                    Continue cancelling
                  </Button>
                </div>
              </div>
            </>
          )}

          {cancelFlowStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>What could we do better?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve for everyone. Why are you cancelling?
                </p>
                <div className="space-y-2">
                  {[
                    'Too expensive',
                    'Not using it enough',
                    'Answers aren\'t accurate enough',
                    'Exams are over',
                    'Found a better alternative',
                    'Other',
                  ].map(reason => (
                    <button
                      key={reason}
                      onClick={() => setCancelReason(reason)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        cancelReason === reason
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="brand" className="flex-1" onClick={() => setCancelFlowOpen(false)}>
                    Never mind, keep it
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground text-xs"
                    onClick={() => cancelReason ? setCancelFlowStep(2) : toast.error('Please select a reason')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}

          {cancelFlowStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Last chance
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {cancelReason === 'Too expensive' ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Special offer just for you</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Switch to the Exam Season Pass for £39.99 one-time — that's less than 5 months of your current subscription, and it covers you all the way through exams.
                    </p>
                    <Button variant="brand" size="sm" className="mt-3" onClick={() => { setCancelFlowOpen(false); navigate('/compare'); }}>
                      View Exam Season Pass
                    </Button>
                  </div>
                ) : cancelReason === 'Not using it enough' ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Tip: Set a daily study reminder</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Even 10 minutes a day with the AI tutor can make a real difference. Students who study consistently score on average a full grade higher.
                    </p>
                  </div>
                ) : null}

                <p className="text-sm text-muted-foreground">
                  If you cancel, you'll keep access until the end of your current billing period. After that, you'll be downgraded to the free plan (3 prompts/day).
                </p>

                <div className="flex gap-3">
                  <Button variant="brand" className="flex-1" onClick={() => setCancelFlowOpen(false)}>
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive" size="sm"
                    onClick={confirmCancellation}
                    disabled={cancellingSubscription !== null}
                  >
                    {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
