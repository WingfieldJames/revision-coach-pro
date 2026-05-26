import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export const PersonalStatementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Personal Statement | A* AI"
        description="A* AI is building a Personal Statement tool to help you write a stronger UCAS application."
        canonical="https://astarai.co.uk/personal-statement"
      />
      <DottedSurface speed={0.03} />

      <Header />

      <div className="flex-1 relative z-10 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-6 -mt-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Coming soon
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Personal Statement</h1>
          <p className="text-muted-foreground text-lg">
            We're building this. Pop back soon — or revise a subject in the meantime.
          </p>
          <div className="pt-2">
            <Button size="lg" onClick={() => navigate('/select')} className="px-8">
              Start studying a subject
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
