import React from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";

export const ProgressPage = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SEOHead
        title="Schools | A* AI – B2B for Schools"
        description="A* AI for schools – bring AI-powered revision tools to your institution."
        canonical="https://astarai.co.uk/progress"
      />
      <Header showNavLinks />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="text-gradient-brand">Schools</span>
        </h1>
        <p className="text-muted-foreground text-lg">Coming soon 🚀</p>
      </div>
    </div>
  );
};
