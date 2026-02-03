import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, Instagram, Music, Calendar, BookOpen, GraduationCap, Search, FileCheck } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { HeroBackgroundPaths } from '@/components/ui/hero-background-paths';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { FoundersCarousel } from '@/components/FoundersCarousel';
import { MobileFoundersSection } from '@/components/MobileFoundersSection';
import { TestimonialsColumn, firstColumn, secondColumn, thirdColumn } from '@/components/ui/testimonials-columns';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';

const revisionFeatures = [
  {
    id: 1,
    title: "Planning",
    date: "Step 1",
    content: "Never miss a deadline. AI-powered exam countdown tracks every paper and builds your personalized revision schedule based on your target grade.",
    category: "Planning",
    icon: Calendar,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Content Learning",
    date: "Step 2",
    content: "Tailored to you. Trained on your exact specification and adapted to your learning style - visual, detailed, or concise explanations on demand.",
    category: "Learning",
    icon: BookOpen,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Exam Technique",
    date: "Step 3",
    content: "Learn from 4 A* students. Master the proven techniques that got real students into Oxbridge/Imperial/LSE & more - from essay structure to top-band evaluation.",
    category: "Technique",
    icon: GraduationCap,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 80,
  },
  {
    id: 4,
    title: "Past Paper Finder",
    date: "Step 4",
    content: "2,000+ questions searchable instantly. Find any question by topic or keyword, with official mark schemes included.",
    category: "Practice",
    icon: Search,
    relatedIds: [3, 5],
    status: "pending" as const,
    energy: 60,
  },
  {
    id: 5,
    title: "Essay Marker",
    date: "Step 5",
    content: "90% teacher accuracy. Upload your essay, get instant breakdown of every AO, see exactly where you gained and lost marks.",
    category: "Feedback",
    icon: FileCheck,
    relatedIds: [4],
    status: "pending" as const,
    energy: 40,
  },
];
export const HomePage = () => {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Require login first, then go to subjects/pricing page
  const handleNavigation = () => {
    if (!user) {
      navigate('/login?redirect=compare');
    } else {
      navigate('/compare');
    }
  };
  return <div className="min-h-screen bg-background font-sans">
      <SEOHead title="A* AI – Get an A* in A-Level Economics | AI Revision Coach" description="Join 1000+ students using A* AI to master A-Level Economics. Trained on real past papers (2017-2025), mark schemes & examiner reports. Free to try – get your A* today." canonical="https://astarai.co.uk/" />
      <Header showNavLinks />
      
      {/* Hero Scroll Animation Section */}
      <section className="overflow-hidden pb-0 mt-4 sm:-mt-8 md:-mt-8">
        <HeroBackgroundPaths>
          {isMobile ?
        // Mobile version - simple image without scroll animation
        <div className="pt-4 px-6">
              <div className="text-left max-w-5xl mx-auto pt-4">
                <div className="bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full inline-block mb-4 text-center whitespace-nowrap">
                  ⭐ Loved by 700+ users with a 4.9 star rating
                </div>
                <h1 className="text-6xl font-bold mb-3 flex flex-wrap items-center gap-2">
                  Meet 
                  <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI - A Star AI Logo - AI-powered A-Level Economics revision coach" className="h-16" />
                </h1>
                <h2 className="text-2xl sm:text-4xl font-medium text-foreground mb-6 leading-tight whitespace-nowrap">
                  ​The AI built for your exam board
                </h2>
              </div>
              
              <div className="mb-6">
                <div className="relative w-full rounded-lg overflow-hidden">
                  {/* Poster image shows instantly */}
                  <img src="/video-poster.png" alt="" className="w-full h-auto" />
                  {/* Video plays on top with identical sizing */}
                  <iframe src="https://player.vimeo.com/video/1157200471?background=1&autoplay=1&loop=1&muted=1" className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="A* AI Demo Video" />
                </div>
              </div>

              <div className="text-center mb-8">
                <InteractiveHoverButton text="Pick your subject →" variant="default" onClick={() => handleNavigation()} className="pointer-events-auto text-sm px-5 py-2.5 w-[200px]" />
                <p className="text-xs text-muted-foreground mt-3">
                  Get started free • No card needed
                </p>
              </div>
            </div> :
        // Desktop version - scroll animation with iPad
        <>
              <ContainerScroll titleComponent={<>
                    <div className="text-left max-w-5xl mx-auto px-6 sm:px-8 pt-4 sm:pt-0">
                      <div className="bg-secondary text-foreground text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-4 md:mb-6 max-w-[95%] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                        ⭐ Loved by 700+ users with a 4.9 star rating
                      </div>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                        Meet 
                        <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI - A Star AI Logo - AI-powered A-Level Economics revision coach" className="h-9 md:h-10 lg:h-12" />
                      </h1>
              <h2 className="text-base md:text-xl lg:text-2xl font-medium text-foreground mb-6 md:mb-8">
                ​Trained by the UK’s top A* students. Built for your exam board
              </h2>
                    </div>
                  </>}>
                <img src="/lovable-uploads/hero-ipad-demo.jpg" alt="A* AI Demo - A Star AI interface showing A-Level Economics revision features on iPad" className="mx-auto rounded-2xl object-contain h-full object-center" />
              </ContainerScroll>
              
              <div className="text-center mb-8 -mt-12 md:-mt-20 relative z-50 px-4">
                <InteractiveHoverButton text="Pick your subject →" variant="default" onClick={() => handleNavigation()} className="pointer-events-auto text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 w-[200px] sm:w-[220px]" />
                <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                  Get started free • No card needed
                </p>
              </div>
            </>}
        </HeroBackgroundPaths>
      </section>

      {/* Trained by A* Students Section - Desktop only (moved up) */}
      <div className="hidden md:block">
        <FoundersCarousel />
      </div>

      {/* Video Demo Section - Desktop only - NO animation background */}
      <section className="hidden md:block py-16 bg-background">
        <div className="max-w-7xl mx-auto px-8">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>See</span>
                <img src="/lovable-uploads/702cde0a-841c-4fee-ab63-d2f157d45a59.png" alt="A* AI Logo" className="h-6 md:h-8" />
                <span>in</span>
                <span className="bg-gradient-brand bg-clip-text text-transparent">action</span>
              </div>
            </h2>
          </ScrollReveal>
        </div>
        
        <ScrollReveal delay={0.2}>
          <div className="max-w-7xl mx-auto px-8">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <iframe src="https://player.vimeo.com/video/1157200471?background=1&loop=1&muted=1" className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="A* AI Demo Video" />
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-8">
          {/* Button beneath video */}
          <div className="text-center mt-8 mb-4">
            <InteractiveHoverButton text="Try A* AI now →" variant="reverse" onClick={() => handleNavigation()} className="pointer-events-auto text-base px-6 py-3 w-[200px]" />
          </div>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground">
            For the best experience, use a laptop or iPad
          </p>
        </div>
      </section>

      {/* Testimonials Section - 3 columns moving UP */}
      <section data-section="testimonials" className="hidden md:block py-16 px-8 bg-muted overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What our users say
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              ​Join 700+ students and teachers achieving real results
            </p>
          </ScrollReveal>

          <div className="flex gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px]">
            <TestimonialsColumn testimonials={firstColumn} duration={25} />
            <TestimonialsColumn testimonials={secondColumn} duration={20} reverse />
            <TestimonialsColumn testimonials={thirdColumn} duration={28} />
          </div>
        </div>
      </section>

      {/* Mobile Founders Section - Above "How A* AI helps" */}
      <MobileFoundersSection />

      {/* How A* AI helps you revise smarter Section */}
      <section className="py-8 md:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="relative z-10">
          <h2 className="text-lg md:text-3xl font-bold text-center mb-8 md:mb-12">
            <div className="flex flex-nowrap md:flex-wrap items-center justify-center gap-1 md:gap-2">
              <span>How</span>
              <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-5 md:h-8" />
              <span>helps you at</span>
              <span className="bg-gradient-brand bg-clip-text text-transparent">every</span>
              <span>stage of revision</span>
            </div>
          </h2>
        </ScrollReveal>

        {/* Desktop: Orbital Timeline */}
        <div className="hidden lg:block">
          <RadialOrbitalTimeline timelineData={revisionFeatures} />
          <div className="text-center mt-4">
            <InteractiveHoverButton 
              text="Try A* AI now →" 
              variant="reverse" 
              onClick={() => handleNavigation()} 
              className="pointer-events-auto text-base px-6 py-3 w-[200px]" 
            />
          </div>
        </div>

        {/* Mobile/Tablet: Expandable Cards */}
        <div className="lg:hidden">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {revisionFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.id}>
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`feature-${feature.id}`} className="border-0 bg-muted rounded-xl overflow-hidden">
                      <AccordionTrigger hideIcon className="p-5 md:p-6 hover:no-underline w-full [&[data-state=open]_.chevron]:rotate-180">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <strong className="text-base md:text-lg font-semibold text-left flex-1">{feature.title}</strong>
                          <ChevronDown className="chevron h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 md:px-6 md:pb-6 pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.content}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          <div className="text-center mt-8">
            <InteractiveHoverButton 
              text="Try A* AI now →" 
              variant="reverse" 
              onClick={() => handleNavigation()} 
              className="pointer-events-auto text-base px-6 py-3 w-[200px]" 
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              Frequently asked questions
            </h2>
            <p className="text-center text-muted-foreground mb-8 text-lg">
              Everything you need to know about A* AI and revision.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <Accordion type="single" collapsible defaultValue="item-1" className="space-y-4">
              <AccordionItem value="item-1" className="bg-muted rounded-xl border-0 overflow-hidden">
                <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                  <span>Why is this better than ChatGPT or a normal AI?</span>
                  <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                  <p className="mb-3">ChatGPT knows a bit about everything. A*AI knows everything about your exam - from paper layout to the small tricks that push you towards top grades.</p>
                  <p className="mb-3">Trained on every past paper, mark scheme, and spec point for your board. A personalised 24/7 tutor, built specifically for your subject.</p>
                  <p>We handpick A* students from the UK's top universities and train the AI on exactly how they think - the structures, the shortcuts, the phrases examiners reward. The brain of an A* student, powered by AI.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-muted rounded-xl border-0 overflow-hidden">
                <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                  <span>How do the plans work?</span>
                  <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                  <p className="mb-3">Free gives you a taste - limited training data and general AI help to try it out.</p>
                  <p className="mb-3">Deluxe is the full experience. Trained on every past paper from 2017-2025, official mark schemes, and the complete specification. Plus exam technique trained directly by A* students - the structures, timings, and evaluation phrases that examiners reward.</p>
                  <p className="mb-3">Deluxe also unlocks premium tools: upload essays and diagrams for instant AI feedback, or use the Diagram Generator to find the exact diagram for any question - all tailored to your subject and exam board.</p>
                  <p>£24.99 once. Less than half a tutoring session. Access forever. That's it.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-muted rounded-xl border-0 overflow-hidden">
                <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                  <span>What's included in the Deluxe version?</span>
                  <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                  <p className="mb-3">We sat down with A* students from LSE, Cambridge, and Imperial and got them to teach the AI everything - how they structured essays, which examples impressed examiners, the timing tricks that saved them marks.</p>
                  <p className="mb-3">That's layered on top of every past paper (2017-2025), official mark schemes, and the full spec. Plus diagram guidance, application banks, model structures, and all future updates.</p>
                  <p>Lifetime access. One payment. Done.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-muted rounded-xl border-0 overflow-hidden">
                <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                  <span>Does it work for other exam boards or subjects?</span>
                  <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200 shrink-0" />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                  <p className="mb-3">We started with A-Level Economics. Now we cover Economics, Computer Science and Physics - with Chemistry, English and Psychology dropping soon and many other subjects in the pipeline                          </p>
                  <p className="mb-3">We're growing fast.</p>
                  <p>Tell us what you need next - we're listening.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollReveal>
          
          <ScrollReveal delay={0.3} className="text-center mt-8">
            <InteractiveHoverButton text="Pick your subject →" variant="reverse" onClick={() => handleNavigation()} className="pointer-events-auto text-base px-6 py-3 w-[220px]" />
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-16 px-8 text-center">
        <ScrollReveal className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png" alt="A* AI" className="h-8" />
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
          </div>
          
          <p className="text-muted-foreground mb-6">
            A* AI (A Star AI) - Your AI-powered A-Level revision coach for Economics, CS, Physics & more | astarai
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
            <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2025 A* AI
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
        </ScrollReveal>
      </footer>
    </div>;
};