import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus } from 'lucide-react';
// import logo from '@/assets/logo.png';
// import phone from '@/assets/phone.png';
// import laptop from '@/assets/laptop.png';
// import tillyTaylor from '@/assets/tilly-taylor.png';
// import elliotSmith from '@/assets/elliot-smith.png';
// import revishann from '@/assets/revishann.png';

export const HomePage = () => {
  const { user, profile } = useAuth();

  // No auto-redirect - always show the home page when accessed directly
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header showNavLinks />
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between p-8 gap-8">
        <div className="flex-1 max-w-2xl">
          <div className="bg-secondary text-foreground text-sm px-4 py-2 rounded-full inline-block mb-6">
            ⭐ Loved by 50+ users with a 4.9 star rating
          </div>
          
          <h1 className="text-5xl font-bold mb-4 flex items-center gap-3">
            Meet <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI logo" className="h-12" />
          </h1>
          
          <h2 className="text-3xl font-medium mb-6 text-foreground">
            Your AI-powered A-Level revision coach
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Revise smarter with A AI — artificial intelligence built for Edexcel Economics. Trained on past papers, mark schemes and examiner insights, it gives you instant answers, live feedback and top-grade exam technique — all in one place.
          </p>
        </div>

        <div className="flex-1 text-center">
          <img src="/lovable-uploads/92ff8122-110e-4b97-8135-37b4607f3798.png" alt="A* AI on mobile" className="max-w-full h-auto mx-auto" />
          <Button variant="brand" size="xl" asChild className="mt-6">
            <Link to="/compare">Try It Now →</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-8 text-center bg-muted">
        <h2 className="text-3xl font-bold mb-8">
          Used by your favourite study influencers & top students 👀
        </h2>
        
        <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src="/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png" alt="Mahmudur Rahman" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Mahmudur Rahman</strong><br />
              <span className="text-sm text-muted-foreground">15m views & 1.5m+ likes</span>
            </div>
          </div>

          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src="/lovable-uploads/f6bb9307-5484-4552-b77a-5ff9dca13907.png" alt="Elliot Smith" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Elliot Smith</strong><br />
              <span className="text-sm text-muted-foreground">BSc Finance, LSE</span>
            </div>
          </div>

          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src="/lovable-uploads/28e78021-41d3-4030-b115-5682fc1d7b71.png" alt="Revishann" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Revishann</strong><br />
              <span className="text-sm text-muted-foreground">A* Student & A-Level Mentor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2">
          How <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" /> helps you revise{' '}
          <span className="bg-gradient-brand bg-clip-text text-transparent">smarter</span>
        </h2>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
          {/* Laptop Image */}
          <div className="flex-1 text-center">
            <img src="/lovable-uploads/57ee3730-ed40-48ca-a81c-378b769729de.png" alt="Laptop mockup" className="max-w-full h-auto mx-auto" />
            <Button variant="brand" size="xl" asChild className="mt-8">
              <Link to="/compare">Try A* AI Now →</Link>
            </Button>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📄 Past Paper Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Search and retrieve real past paper questions by topic, paper, or command word. 
                A* AI understands how Edexcel organises questions, making practice fully targeted.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📰 Live Updated Application</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                The latest examples and case studies — formatted specifically for 25-mark essays 
                in Paper 1 and 2. Updated regularly from global economic news to match Edexcel expectations.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl p-6">
              <strong className="text-lg font-semibold">📊 Diagram Mastery</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Every key diagram — from negative externalities to subsidies, tariffs to buffer stocks — 
                is built-in and explained so you can deploy it mid-essay with precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-2">
            Frequently asked questions
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about <span className="bg-gradient-brand bg-clip-text text-transparent">A* AI</span> and revision.
          </p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full">
                <span>How does A* AI understand Edexcel Economics?</span>
                <Plus className="h-5 w-5 text-[#a855f7] transition-transform duration-200 data-[state=open]:rotate-45 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground">
                A* AI has been specifically trained on Edexcel Economics past papers, mark schemes, and examiner reports to understand the exact requirements and expectations for your exam board.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full">
                <span>Can I practice with real past paper questions?</span>
                <Plus className="h-5 w-5 text-[#a855f7] transition-transform duration-200 data-[state=open]:rotate-45 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground">
                Yes! A* AI provides access to authentic past paper questions organized by topic, command word, and difficulty level, so you can practice exactly what you need.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full">
                <span>How often are the case studies and examples updated?</span>
                <Plus className="h-5 w-5 text-[#a855f7] transition-transform duration-200 data-[state=open]:rotate-45 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground">
                Our live application examples are updated regularly from current global economic events, ensuring you have the most relevant and up-to-date case studies for your essays.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full">
                <span>Does A* AI help with diagram drawing?</span>
                <Plus className="h-5 w-5 text-[#a855f7] transition-transform duration-200 data-[state=open]:rotate-45 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground">
                Absolutely! A* AI includes all key economic diagrams with step-by-step explanations, helping you understand when and how to use them effectively in your exams.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full">
                <span>Is there a free version available?</span>
                <Plus className="h-5 w-5 text-[#a855f7] transition-transform duration-200 data-[state=open]:rotate-45 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground">
                Yes, we offer a free version with limited features so you can try A* AI before upgrading. The premium version unlocks full access to all past papers, unlimited questions, and advanced features.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <span className="text-xl font-semibold">A* AI</span>
          </div>
          
          <p className="text-muted-foreground mb-8">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          {!user && (
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="brand" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};