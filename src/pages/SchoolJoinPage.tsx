import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, LogIn, UserPlus, Loader2 } from 'lucide-react';

const INVITE_CODE_STORAGE_KEY = 'school_invite_code';

export const SchoolJoinPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login_required'>('loading');
  const [schoolName, setSchoolName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inviteCode = searchParams.get('code') || localStorage.getItem(INVITE_CODE_STORAGE_KEY) || '';

  useEffect(() => {
    if (!inviteCode) {
      setStatus('error');
      setErrorMessage('No invite code provided. Please use the link from your invitation email.');
      return;
    }

    // Store the code in case user needs to log in first
    localStorage.setItem(INVITE_CODE_STORAGE_KEY, inviteCode);

    if (user) {
      acceptInvite();
    } else {
      setStatus('login_required');
    }
  }, [user, inviteCode]);

  const acceptInvite = async () => {
    if (!user || !inviteCode) return;
    setStatus('accepting');

    try {
      const response = await supabase.functions.invoke('school-accept-invite', {
        body: {
          invite_code: inviteCode,
          user_id: user.id,
        },
      });

      if (response.error) {
        setStatus('error');
        setErrorMessage(response.error.message || 'Failed to accept invite');
        return;
      }

      const result = response.data;

      if (result.success) {
        setSchoolName(result.school_name);
        setStatus('success');
        // Clear stored code
        localStorage.removeItem(INVITE_CODE_STORAGE_KEY);
        toast.success(`Welcome to ${result.school_name}!`);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to accept invite');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNavLinks />

      <main className="max-w-lg mx-auto px-4 py-16">
        {status === 'loading' || status === 'accepting' ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {status === 'accepting' ? 'Accepting your invitation...' : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        ) : status === 'success' ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">
                Welcome to {schoolName}!
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                You now have full premium access to A* AI through your school's license.
                Redirecting you to the dashboard...
              </p>
              <Button onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : status === 'login_required' ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Join Your School on A* AI</CardTitle>
              <CardDescription>
                Sign in or create an account to accept your school invitation and get full premium access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="default"
                onClick={() => navigate('/login')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/signup')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-2">
                Your invitation will be automatically accepted after you sign in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">
                Unable to Accept Invite
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                {errorMessage}
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SchoolJoinPage;
