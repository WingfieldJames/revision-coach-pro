import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

export const OCRPhysicsPremiumPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Deluxe A* AI – OCR Physics | Coming Soon"
        description="A* AI Deluxe for OCR Physics is coming soon. Full training on past papers, mark schemes, A* technique & unlimited prompts."
        canonical="https://astarai.co.uk/ocr-physics-premium"
      />
      <Header showNavLinks />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold mb-4">OCR Physics Deluxe</h1>
          <p className="text-xl text-primary font-semibold mb-4">Coming Soon</p>
          <p className="text-muted-foreground mb-8">
            We're working hard to bring you the Deluxe version for OCR Physics. 
            In the meantime, try our free version to get started!
          </p>
          <div className="flex flex-col gap-4">
            <Button variant="brand" size="lg" onClick={() => navigate('/ocr-physics-free-version')}>
              Try Free Version
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/compare')}>
              View All Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};