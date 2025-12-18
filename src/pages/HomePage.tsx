import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, Instagram, Music } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { useIsMobile } from '@/hooks/use-mobile';
// import logo from '@/assets/logo.png';
// import phone from '@/assets/phone.png';
// import laptop from '@/assets/laptop.png';
// import tillyTaylor from '@/assets/tilly-taylor.png';
// import elliotSmith from '@/assets/elliot-smith.png';
// import revishann from '@/assets/revishann.png';

export const HomePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // No auto-redirect - always show the home page when accessed directly
  return <div className="min-h-screen bg-background font-sans">
      <Header showNavLinks />
      
      {/* Hero Scroll Animation Section */}
      <section className="overflow-hidden pb-0 mt-4 sm:-mt-8 md:-mt-8">
        {isMobile ? (
          // Mobile version - simple image without scroll animation
          <div className="pt-4">
            <div className="text-left max-w-5xl mx-auto px-6 pt-4">
              <div className="bg-secondary text-foreground text-base px-3 py-1.5 rounded-full inline-block mb-4 max-w-[95%] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                ⭐ Loved by 100+ users with a 4.9 star rating
              </div>
              <h1 className="text-6xl font-bold mb-3 flex flex-wrap items-center gap-2">
                Meet 
                <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI - A Star AI Logo - AI-powered A-Level Economics revision coach" className="h-16" />
              </h1>
              <h2 className="text-4xl font-medium text-foreground mb-6 leading-tight">
                Your AI-powered coach for A-Level Edexcel Economics - astarai
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Trained on past papers, mark schemes, specifications and A* technique - giving you everything you need to hit that top grade all in one place
              </p>
            </div>
            
            <div className="px-6 mb-6">
              <img 
                src="/lovable-uploads/hero-mobile-phone.png" 
                alt="A* AI Demo - A Star AI mobile interface for A-Level Economics revision" 
                className="mx-auto rounded-2xl object-contain w-full max-w-[360px]" 
              />
            </div>
            
            <div className="text-center mb-8 px-6">
              
              <InteractiveHoverButton 
                text="Get started today →" 
                variant="default"
                onClick={() => navigate('/compare')}
                className="pointer-events-auto text-sm px-5 py-2.5 w-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-3">
                Get started free • No card needed
              </p>
            </div>
          </div>
        ) : (
          // Desktop version - scroll animation with iPad
          <>
            <ContainerScroll titleComponent={<>
                  <div className="text-left max-w-5xl mx-auto px-6 sm:px-8 pt-4 sm:pt-0">
                    <div className="bg-secondary text-foreground text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-4 md:mb-6 max-w-[95%] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                      ⭐ Loved by 100+ users with a 4.9 star rating
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                      Meet 
                      <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI - A Star AI Logo - AI-powered A-Level Economics revision coach" className="h-9 md:h-10 lg:h-12" />
                    </h1>
                    <h2 className="text-base md:text-xl lg:text-2xl font-medium text-foreground mb-6 md:mb-8">
                      Your AI-powered coach for A-Level Edexcel Economics - astarai
                    </h2>
                  </div>
                </>}>
              <img 
                src="/lovable-uploads/hero-ipad-demo.jpg" 
                alt="A* AI Demo - A Star AI interface showing A-Level Economics revision features on iPad" 
                className="mx-auto rounded-2xl object-contain h-full object-center" 
              />
            </ContainerScroll>
            
            <div className="text-center mb-8 -mt-12 md:-mt-20 relative z-50 px-4">
              <InteractiveHoverButton 
                text="Get started today →" 
                variant="default"
                onClick={() => navigate('/compare')}
                className="pointer-events-auto text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 w-[200px] sm:w-[220px]"
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                Get started free • No card needed
              </p>
            </div>
          </>
        )}
      </section>

      {/* Hero Section */}
      

      {/* Testimonials Section */}
      <section data-section="testimonials" className="py-16 px-8 text-center bg-muted">
        <h2 className="text-3xl font-bold mb-8">
          A* AI is used by your favourite study influencers & top students 👀
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
            <img src="/lovable-uploads/tanuj-kakumani-updated.jpg" alt="Tanuj Kakumani" className="w-full h-48 object-cover object-[center_30%]" />
            <div className="p-4 text-left">
              <strong className="text-card-foreground">Tanuj Kakumani</strong><br />
              <span className="text-sm text-muted-foreground">BSc EFDS, Imperial & Founder of EconBridge</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span>See</span>
              <img src="/lovable-uploads/702cde0a-841c-4fee-ab63-d2f157d45a59.png" alt="A* AI Logo" className="h-6 md:h-8" />
              <span>in</span>
              <span className="bg-gradient-brand bg-clip-text text-transparent">action</span>
            </div>
          </h2>
          
          <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
            <iframe src="https://player.vimeo.com/video/1115781223?badge=0&autopause=0&player_id=0&app_id=58479" className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="A* AI Demo Video" />
          </div>

          {/* Button beneath video */}
          <div className="text-center mb-4">
            <InteractiveHoverButton 
              text="Try A* AI now →" 
              variant="reverse"
              onClick={() => navigate('/compare')}
              className="pointer-events-auto text-base px-6 py-3 w-[200px]"
            />
          </div>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground">
            For the best experience, use a laptop or iPad
          </p>
        </div>
      </section>

      {/* How A* AI helps you revise smarter Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>How</span>
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-6 md:h-8" />
            <span>helps you revise</span>
            <span className="bg-gradient-brand bg-clip-text text-transparent">smarter</span>
          </div>
        </h2>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
          {/* Laptop Image */}
          <div className="flex-1 text-center">
            <img src="/lovable-uploads/57ee3730-ed40-48ca-a81c-378b769729de.png" alt="Laptop mockup" className="max-w-full h-auto mx-auto" />
            <InteractiveHoverButton 
              text="Try A* AI now →" 
              variant="reverse"
              onClick={() => navigate('/compare')}
              className="pointer-events-auto text-base px-6 py-3 w-[200px] mt-8"
            />
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
              <strong className="text-lg font-semibold">📈 A* Technique</strong>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                From 2 markers to 25 markers, A* AI knows exactly how to structure every response. It guides you through KAA, chains of reasoning and evaluation — so you can write those top band answers that examiners love
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Powered by AI Models Section */}
      <section className="py-16 px-8 bg-muted">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            Powered by leading AI models ⬇️
          </h2>
          
          <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 mb-6">
            <img src="/logos/openai-final.png" alt="OpenAI" className="h-10 md:h-14 lg:h-16 object-contain" />
            <img src="/logos/gemini-final.png" alt="Gemini" className="h-10 md:h-14 lg:h-16 object-contain" />
            <img src="/logos/deepseek-final.png" alt="DeepSeek" className="h-8 md:h-10 lg:h-12 object-contain" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            * A* AI is currently deployed using OpenAI. Other AI models are available for testing upon request.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            Frequently asked questions
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-lg">
            Everything you need to know about A* AI and revision.
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
          
          <div className="text-center mt-8">
            <InteractiveHoverButton 
              text="Get started today →" 
              variant="reverse"
              onClick={() => navigate('/compare')}
              className="pointer-events-auto text-base px-6 py-3 w-[220px]"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={20} />
            </a>
          </div>
          
          <p className="text-muted-foreground mb-6">
            A* AI (A Star AI) - Your AI-powered A-Level revision coach for Edexcel Economics | astarai
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
          
          {/* Social Media Icons and Copyright */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={24} />
            </a>
            <p className="text-sm text-muted-foreground">
              © A* AI
            </p>
          </div>
          
          {!user && <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="brand" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>}
        </div>
      </footer>
    </div>;
};