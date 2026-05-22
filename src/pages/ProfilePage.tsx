import React from 'react';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ProfileContent } from '@/components/ProfileContent';

export const ProfilePage = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Profile | A* AI" description="Manage your A* AI profile, subscriptions, and study stats." canonical="https://astarai.co.uk/profile" />
      <Header showNavLinks />
      <div className="py-4 px-4 sm:px-8 max-w-3xl mx-auto">
        <ProfileContent />
      </div>
    </div>
  );
};
