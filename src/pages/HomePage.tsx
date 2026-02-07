import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, Instagram, Calendar, BookOpen, GraduationCap, Search, FileCheck, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { HeroBackgroundPaths } from '@/components/ui/hero-background-paths';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { FoundersCarousel } from '@/components/FoundersCarousel';
import { MobileFoundersSection } from '@/components/MobileFoundersSection';
import { TestimonialsColumn, firstColumn, secondColumn, thirdColumn } from '@/components/ui/testimonials-columns';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
const revisionFeatures = [{
  id: 1,
  title: "Planning",
  date: "Step 1",
  content: "Never miss a deadline. AI-powered exam countdown tracks every paper and builds your personalized revision schedule based on your target grade.",
  category: "Planning",
  icon: Calendar,
  relatedIds: [2],
  status: "completed" as const,
  energy: 100
}, {
  id: 2,
  title: "Content Learning",
  date: "Step 2",
  content: "Tailored to you. Trained on your exact specification and adapted to your learning style - visual, detailed, or concise explanations on demand.",
  category: "Learning",
  icon: BookOpen,
  relatedIds: [1, 3],
  status: "completed" as const,
  energy: 90
}, {
  id: 3,
  title: "Exam Technique",
  date: "Step 3",
  content: "Learn from 4 A* students. Master the proven techniques that got real students into Oxbridge/Imperial/LSE & more - from essay structure to top-band evaluation.",
  category: "Technique",
  icon: GraduationCap,
  relatedIds: [2, 4],
  status: "in-progress" as const,
  energy: 80
}, {
  id: 4,
  title: "Past Paper Finder",
  date: "Step 4",
  content: "2,000+ questions searchable instantly. Find any question by topic or keyword, with official mark schemes included.",
  category: "Practice",
  icon: Search,
  relatedIds: [3, 5],
  status: "pending" as const,
  energy: 60
}, {
  id: 5,
  title: "Essay Marker",
  date: "Step 5",
  content: "90% teacher accuracy. Upload your essay, get instant breakdown of every AO, see exactly where you gained and lost marks.",
  category: "Feedback",
  icon: FileCheck,
  relatedIds: [4],
  status: "pending" as const,
  energy: 40
}];
export const HomePage = () => {
  const {
    user
  } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === 'dark' ? logo : logoDark;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handlePickSubject = () => {
    navigate('/compare');
  };
  const handleSeeHowItWorks = () => {
    const section = document.querySelector('[data-section="how-it-works"]');
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  const subjects = ['Economics', 'CS', 'Chemistry', 'Psychology', 'Physics', 'Maths'];
  const [currentSubjectIndex, setCurrentSubjectIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return <div className="min-h-screen bg-background font-sans">
      <SEOHead title="A* AI – Get an A* in A-Level Economics | AI Revision Coach" description="Join 1000+ students using A* AI to master A-Level Economics. Trained on real past papers (2017-2025), mark schemes & examiner reports. Free to try – get your A* today." canonical="https://astarai.co.uk/" />
      <Header showNavLinks />
      
      {/* Mobile Social Proof - sits right under header */}
      <div className="md:hidden text-center mt-2 mb-0 px-4">
        <span className={`text-foreground text-xs font-medium whitespace-nowrap ${theme === 'light' ? 'inline-flex items-center px-4 py-1.5 rounded-full bg-foreground/[0.04] border border-foreground/10' : ''}`}>⭐ Loved by 1.1k+ students with a 4.9 star rating</span>
      </div>

      {/* Hero Section - Rebuilt */}
      <section className="overflow-hidden pb-0 mt-2 md:mt-4 sm:-mt-4">
        <HeroBackgroundPaths>
          <div className="px-6 sm:px-8 py-10 sm:py-24 md:py-32 text-center max-w-5xl mx-auto">
            {/* Social Proof Pill - Desktop only */}
            <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border border-foreground/10 bg-foreground/5 backdrop-blur-sm" style={{
            boxShadow: 'var(--shadow-glow)'
          }}>
              <Star className="w-4 h-4 text-[#FFC83D] fill-[#FFC83D]" />
              <span className="text-foreground text-sm font-medium">Loved by 1.1k+ students with a 4.9 star rating</span>
            </div>

            {/* Meet A* AI - Mobile only */}
            <div className="flex md:hidden items-center justify-center gap-0 mb-2 -mt-2">
              <span className={`text-foreground font-bold ${theme === 'dark' ? 'text-4xl' : 'text-5xl'}`}>Meet</span>
              <img src={currentLogo} alt="A* AI" className={`${theme === 'dark' ? 'h-28' : 'h-20'} -mx-2`} />
            </div>

            {/* Main Headline */}
            <h1 className="text-[1.25rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold mb-6 leading-[1.2]">
              <div className="text-foreground whitespace-nowrap">The AI that actually</div>
              <div className="whitespace-nowrap">
                <span className="text-foreground">understands </span>
                <span className="text-gradient-brand">A-Level </span>
                <span className="relative inline-block overflow-hidden text-left" style={{ width: '5.5em', height: '1em', verticalAlign: 'text-bottom' }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={subjects[currentSubjectIndex]}
                      className="absolute left-0 bottom-0 text-gradient-brand"
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-100%', opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {subjects[currentSubjectIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </h1>

            {/* Subheadline - Hidden on mobile */}
            <p className="hidden md:block text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              We worked alongside the <span className="text-foreground font-medium">highest performing students</span> in the UK to train an AI model on <span className="text-foreground font-medium">everything you need</span> to ace your final exam — from the spec to past papers to the exact <span className="text-foreground font-medium">A* technique</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handlePickSubject} className="px-8 py-3.5 rounded-full text-white font-semibold text-base sm:text-lg transition-all duration-300 hover:-translate-y-0.5 glow-brand hover:glow-brand-intense" style={{
              background: 'var(--gradient-brand)'
            }}>
                Pick Your Subject →
              </button>
              <button onClick={handleSeeHowItWorks} className="px-8 py-3.5 rounded-full text-foreground font-semibold text-base sm:text-lg border border-foreground/30 bg-transparent transition-all duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground">
                See How It Works
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mt-4">
              Get started free • No card needed
            </p>
          </div>
        </HeroBackgroundPaths>
      </section>

      {/* Trained by A* Students Section - Desktop only */}
      <div className="hidden md:block">
        <FoundersCarousel />
      </div>

      {/* Video Demo Section - Desktop only */}
      <section className="hidden md:block py-16 bg-background">
        <div className="max-w-7xl mx-auto px-8">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>See</span>
                <img src={currentLogo} alt="A* AI Logo" className="h-6 md:h-8" />
                <span>in</span>
                <span className="text-gradient-brand">action</span>
              </div>
            </h2>
          </ScrollReveal>
        </div>
        
        <ScrollReveal delay={0.2}>
          <div className="max-w-7xl mx-auto px-8">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/30">
              <iframe src="https://player.vimeo.com/video/1157200471?background=1&loop=1&muted=1" className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="A* AI Demo Video" />
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mt-8 mb-4">
            <InteractiveHoverButton text="Get started free →" variant="reverse" onClick={handlePickSubject} className="pointer-events-auto text-base px-6 py-3 w-[220px]" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            For the best experience, use a laptop or iPad
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section data-section="testimonials" className="hidden md:block py-16 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">What our users say</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Join 700+ students and teachers achieving real results</p>
          </ScrollReveal>

          <div className="flex gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px]">
            <TestimonialsColumn testimonials={firstColumn} duration={45} />
            <TestimonialsColumn testimonials={secondColumn} duration={40} />
            <TestimonialsColumn testimonials={thirdColumn} duration={50} />
          </div>
        </div>
      </section>

      <MobileFoundersSection />

      {/* How A* AI helps you revise smarter Section */}
      <section data-section="how-it-works" className="py-8 md:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <ScrollReveal className="relative z-10">
          <h2 className="text-lg md:text-3xl font-bold text-center mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-1 md:gap-2">
              <div className="flex items-center gap-1 md:gap-2">
                <span>How</span>
                <img src={currentLogo} alt="A* AI" className="h-5 md:h-8" />
                <span>helps you at</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-gradient-brand">every</span>
                <span>stage of revision</span>
              </div>
            </div>
          </h2>
        </ScrollReveal>

        <div className="hidden lg:block">
          <RadialOrbitalTimeline timelineData={revisionFeatures} />
          <div className="text-center mt-4">
            <InteractiveHoverButton text="Get started free →" variant="reverse" onClick={handlePickSubject} className="pointer-events-auto text-base px-6 py-3 w-[220px]" />
          </div>
        </div>

        <div className="lg:hidden">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {revisionFeatures.map(feature => {
            const Icon = feature.icon;
            return <StaggerItem key={feature.id}>
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
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </StaggerItem>;
          })}
          </StaggerContainer>
          <div className="text-center mt-8">
            <InteractiveHoverButton text="Try A* AI now →" variant="reverse" onClick={handlePickSubject} className="pointer-events-auto text-base px-6 py-3 w-[200px]" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 md:px-8 bg-background relative overflow-hidden">
        <HeroBackgroundPaths>
          <div className="max-w-4xl mx-auto relative z-10 px-2 md:px-0">
            <ScrollReveal>
              <h2 className="text-xl sm:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2 whitespace-nowrap">
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
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">ChatGPT knows a bit about everything. A*AI knows everything about your exam - from paper layout to the small tricks that push you towards top grades.</p>
                    <p className="mb-3">Trained on every past paper, mark scheme, and spec point for your board. A personalised 24/7 tutor, built specifically for your subject.</p>
                    <p>We handpick A* students from the UK's top universities and train the AI on exactly how they think - the structures, the shortcuts, the phrases examiners reward. The brain of an A* student, powered by AI.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    <span>How does it work?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">Pick your subject and start chatting. The AI is trained on your exact specification, past papers, and mark schemes.</p>
                    <p className="mb-3">Use the built-in tools — Diagram Generator, Essay Marker, Past Paper Finder — to practice and get instant feedback.</p>
                    <p>It's like having an A* student available 24/7 to help you revise.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    <span>What subjects do you cover?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">We cover Economics (Edexcel, AQA, CIE), Computer Science (OCR), Physics (OCR), Chemistry (AQA) and Psychology (AQA).</p>
                    <p>More subjects dropping soon. Tell us what you need next — we're listening.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger hideIcon className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    <span>Is it really free?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">Yes! Create an account and start using all the features for free. No credit card required.</p>
                    <p>For even more training data and priority support, you can upgrade to the Exam Season Pass or Monthly plan.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollReveal>
            
            <ScrollReveal delay={0.3} className="text-center mt-8">
              <InteractiveHoverButton text="Pick your subject →" variant="reverse" onClick={handlePickSubject} className="pointer-events-auto text-base px-6 py-3 w-[220px]" />
            </ScrollReveal>
          </div>
        </HeroBackgroundPaths>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 text-center border-t border-border/30">
        <ScrollReveal className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={currentLogo} alt="A* AI" className="h-12 sm:h-14" />
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
            <Link to="/compare" className="text-gradient-brand hover:opacity-80 transition-opacity">Plans</Link>
            <span>•</span>
            <Link to="/#faq" className="text-gradient-brand hover:opacity-80 transition-opacity">FAQs</Link>
            <span>•</span>
            <Link to="/login" className="text-gradient-brand hover:opacity-80 transition-opacity" onClick={() => window.scrollTo(0, 0)}>Sign in</Link>
            <span>•</span>
            <Link to="/contact" className="text-gradient-brand hover:opacity-80 transition-opacity">Contact</Link>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Secure checkout via Stripe • Your chats stay private
          </p>
          
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