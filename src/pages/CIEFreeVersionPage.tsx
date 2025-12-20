import React, { useEffect } from 'react';
import { Header } from '@/components/Header';

export const CIEFreeVersionPage = () => {
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showNavLinks showImageTool showDiagramTool showEssayMarker toolsLocked />
      
      <div className="flex-1 relative flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">CIE Economics Free Version</h1>
          <p className="text-muted-foreground">Coming soon! The chatbot will be available shortly.</p>
        </div>
      </div>
    </div>
  );
};