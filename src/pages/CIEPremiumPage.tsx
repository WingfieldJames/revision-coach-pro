import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { checkProductAccess } from '@/lib/productAccess';

export const CIEPremiumPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!loading) {
        if (!user) {
          navigate('/login?redirect=cie-premium');
          return;
        }
        
        const { hasAccess } = await checkProductAccess(user.id, 'cie-economics');
        
        if (!hasAccess) {
          navigate('/compare');
          return;
        }
        
        setCheckingAccess(false);
      }
    };
    
    verifyAccess();
  }, [user, loading, navigate]);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  if (loading || checkingAccess) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Premium Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You need a CIE Economics premium subscription to access this content.
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
        <Header showNavLinks showImageTool showDiagramTool />
      </div>
      
      <div className="flex-1 relative flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">CIE Economics Premium Version</h1>
          <p className="text-muted-foreground">Coming soon! The premium chatbot will be available shortly.</p>
        </div>
      </div>
    </div>
  );
};