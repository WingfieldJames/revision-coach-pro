import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const PremiumVersionPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login?redirect=premium');
        return;
      }
      
      if (!profile?.is_premium) {
        navigate('/compare');
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_premium) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You need a premium subscription to access this content.
          </p>
          <Button variant="brand" onClick={() => navigate('/compare')}>
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative z-10">
        <Header showNavLinks />
      </div>
      
      <div className="flex-1 relative">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/1l2aTsS1zKI3FgVTquzOu"
          width="100%"
          style={{ height: 'calc(100vh - 88px)' }}
          frameBorder="0"
          allow="clipboard-write"
          title="A* AI Premium Version Chatbot"
          className="absolute inset-0 border-none"
        />
      </div>
    </div>
  );
};