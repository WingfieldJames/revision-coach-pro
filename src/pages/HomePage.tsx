import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';
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
            Your AI-powered coach for Edexcel Economics
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Trained on past papers, mark schemes, specifications and A* technique — giving you everything you need to hit that top grade all in one place
          </p>
        </div>

        <div className="flex-1 text-center">
          <img src="/lovable-uploads/962384ae-eb06-481f-a929-16bce5c920a5.png" alt="A* AI on mobile" className="max-w-full h-auto mx-auto" />
          <div className="inline-block mt-6">
            <Button variant="brand" size="xl" asChild>
              <Link to="/compare">Try It Now →</Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-3 text-left">
              Get started free • No card needed
            </p>
          </div>
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
            <img src="/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png" alt="Sina Naderi" className="w-full h-48 object-cover object-[center_20%]" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Sina Naderi</strong><br />
              <span className="text-sm text-muted-foreground">BA Economics, Cambridge</span>
            </div>
          </div>

          <div className="w-60 bg-card rounded-xl shadow-card overflow-hidden">
            <img src="/lovable-uploads/969a1783-decd-4d64-91c4-1bad8744769b.png" alt="Mark Somers" className="w-full h-48 object-cover" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Mark Somers</strong><br />
              <span className="text-sm text-muted-foreground">BSc Finance, LSE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>See</span>
            <img src="/lovable-uploads/702cde0a-841c-4fee-ab63-d2f157d45a59.png" alt="A* AI Logo" className="h-6 md:h-8" />
            <span>in</span>
            <span className="bg-gradient-brand bg-clip-text text-transparent">action</span>
          </div>
        </h2>
        
        {/* Responsive Video Container */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe 
            src="https://player.vimeo.com/video/1115781223?badge=0&autopause=0&player_id=0&app_id=58479" 
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0" 
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            title="A* AI Demo Video"
          />
        </div>
        
        {/* Button beneath video */}
        <div className="text-center mt-8">
          <Button variant="brand" size="xl" asChild>
            <Link to="/compare">Try A* AI now →</Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-4 px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            Frequently asked questions
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-lg">
            Everything you need to know about <span className="bg-gradient-brand bg-clip-text text-transparent">A* AI</span> and revision.
          </p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg:first-child]:rotate-180 [&>svg:first-child]:hidden text-lg">
                <span>Why is this better than ChatGPT or a normal AI?</span>
                <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                A* AI is purpose-built for Edexcel Economics A (9EC0) and trained on 2017–2023 past papers (P1–P3), official mark schemes, the full spec and A* technique. You get exam-style answers, structures and diagram guidance — not generic AI chat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg:first-child]:rotate-180 [&>svg:first-child]:hidden text-lg">
                <span>How do the plans work?</span>
                <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                Free uses a limited training window and offers general AI help so you can try it out. Deluxe uses the full 2017–2023 training set (P1–P3) with mark-scheme-level feedback, technique and diagrams. It's £19.99 one-time — no subscription. You're not unlocking PDFs; you're using an AI that's trained on them.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg:first-child]:rotate-180 [&>svg:first-child]:hidden text-lg">
                <span>What's included in the Deluxe version?</span>
                <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                The AI is trained on all papers (P1–P3, 2017–2023), official mark schemes and the complete spec. You also get step-by-step diagrams (AD/AS → buffer stocks), an application/examples bank, model structures and all future updates, with lifetime access.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-muted rounded-xl border-0 overflow-hidden">
              <AccordionTrigger className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg:first-child]:rotate-180 [&>svg:first-child]:hidden text-lg">
                <span>Does it work for other exam boards or subjects?</span>
                <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                We're focused on Edexcel Economics A right now. Tell us what you want next — we're listening.
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
          </div>
          
          <p className="text-muted-foreground mb-6">
            Your AI-powered A-Level revision coach for Edexcel Economics
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="bg-gradient-brand bg-clip-text text-transparent hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
          <p className="text-sm text-muted-foreground mb-6">
            © A* AI
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