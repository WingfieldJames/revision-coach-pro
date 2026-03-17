import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, Instagram, Youtube, Linkedin, Calendar, BookOpen, GraduationCap, Search, FileCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeroBackgroundPaths } from "@/components/ui/hero-background-paths";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { MeetTheFounders } from "@/components/MeetTheFounders";
import { TestimonialsColumn, firstColumn, secondColumn, thirdColumn } from "@/components/ui/testimonials-columns";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { SubjectPlanSelector } from "@/components/SubjectPlanSelector";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import appScreenshot from "@/assets/app-screenshot.png";

const revisionFeatures = [
{
  id: 1,
  title: "Planning",
  date: "Step 1",
  content:
  "Never miss a deadline. AI-powered exam countdown tracks every paper and builds your personalized revision schedule based on your target grade.",
  category: "Planning",
  icon: Calendar,
  relatedIds: [2],
  status: "completed" as const,
  energy: 100
},
{
  id: 2,
  title: "Content Learning",
  date: "Step 2",
  content:
  "Tailored to you. Trained on your exact specification and adapted to your learning style - visual, detailed, or concise explanations on demand.",
  category: "Learning",
  icon: BookOpen,
  relatedIds: [1, 3],
  status: "completed" as const,
  energy: 90
},
{
  id: 3,
  title: "Exam Technique",
  date: "Step 3",
  content:
  "Learn from 4 A* students. Master the proven techniques that got real students into Oxbridge/Imperial/LSE & more - from essay structure to top-band evaluation.",
  category: "Technique",
  icon: GraduationCap,
  relatedIds: [2, 4],
  status: "in-progress" as const,
  energy: 80
},
{
  id: 4,
  title: "Past Paper Finder",
  date: "Step 4",
  content:
  "2,000+ questions searchable instantly. Find any question by topic or keyword, with official mark schemes included.",
  category: "Practice",
  icon: Search,
  relatedIds: [3, 5],
  status: "pending" as const,
  energy: 60
},
{
  id: 5,
  title: "Essay Marker",
  date: "Step 5",
  content:
  "90% teacher accuracy. Upload your essay, get instant breakdown of every AO, see exactly where you gained and lost marks.",
  category: "Feedback",
  icon: FileCheck,
  relatedIds: [4],
  status: "pending" as const,
  energy: 40
}];


/** Shared heading class matching FoundersCarousel / hero style */
const sectionHeadingClass = "text-[1.5rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold leading-[1.2] tracking-tight";

export const HomePage = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const currentLogo = theme === "dark" ? logo : logoDark;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // No redirect for signed-in users — homepage is accessible to everyone

  const handlePickSubject = () => {
    navigate("/compare");
    window.scrollTo(0, 0);
  };

  const handleSeeHowItWorks = () => {
    const section = document.querySelector('[data-section="demo-video"]');
    if (section) {
      const y = section.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const subjects = ["Economics", "Computing", "Chemistry", "Psychology", "Physics", "Maths"];
  const [currentSubjectIndex, setCurrentSubjectIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <SEOHead canonical="https://astarai.co.uk/" />
      <Header showNavLinks showStartStudyingButton />

      {/* Hero Section */}
      <section className="overflow-hidden pb-0 mt-0 md:mt-4 sm:-mt-4 md:max-xl:mt-6 md:max-xl:pt-4">
        <HeroBackgroundPaths>
          <div className="px-6 sm:px-8 py-6 sm:py-16 md:py-24 xl:py-16 2xl:py-12 md:max-xl:py-6 max-w-7xl mx-auto md:max-w-none md:pr-0" style={{ paddingLeft: 'max(2rem, calc((100vw - 80rem) / 2))' }}>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              {/* Left side - Text content */}
              <div className="flex-1 text-center md:text-left md:max-w-[500px] xl:max-w-[520px] 2xl:max-w-[560px] md:flex-shrink-0">
                {/* Social Proof Pill */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-border bg-background/80 backdrop-blur-sm">
                  
                  <span className="text-base">⭐</span>
                  <span className="text-foreground text-xs sm:text-sm font-medium">
                    Loved by 5k+ students with a 4.9 star rating
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[4rem] xl:text-[4.5rem] font-bold mb-4 leading-[1.1] tracking-tight">
                  <div className="text-foreground">The AI tutor</div>
                  <div className="text-foreground">built to get</div>
                  <div className="text-foreground">you an <span className="text-primary">A*</span>.</div>
                </h1>

                {/* Subheadline */}
                <p className="text-sm sm:text-base md:text-lg xl:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed mx-auto md:mx-0">
                  Built for your exam board, trained by the highest achieving A* students
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                  <button
                    onClick={handlePickSubject}
                    className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base sm:text-lg transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg hover:bg-primary/90">
                    
                    Pick Your Subject →
                  </button>
                  <button
                    onClick={handleSeeHowItWorks}
                    className="px-8 py-3.5 rounded-full text-foreground font-semibold text-base sm:text-lg border border-foreground/30 bg-transparent transition-all duration-300 hover:bg-primary hover:border-primary hover:text-primary-foreground">
                    
                    See How It Works
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mt-4">Get started free • No card needed</p>
              </div>

              {/* Right side - Device mockup */}
              <div className="hidden md:flex flex-1 justify-end items-center relative -mr-20 xl:-mr-40 2xl:-mr-64">
                <div className="w-full max-w-[720px] xl:max-w-[950px] 2xl:max-w-[1200px] rounded-2xl overflow-hidden border border-border/30 shadow-elevated">
                  <img
                    src={appScreenshot}
                    alt="A* AI essay marker demo"
                    className="w-full h-auto" />
                  
                </div>
              </div>
            </div>
          </div>
        </HeroBackgroundPaths>
      </section>

      {/* Meet the Founders */}
      <div data-section="founders">
        <MeetTheFounders />
      </div>

      {/* See A* AI in action - Demo Video */}
      <section data-section="demo-video" className="hidden md:block py-8 md:py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-8 md:mb-12">
          <h2 className={`${sectionHeadingClass} flex items-center justify-center gap-0 flex-nowrap`}>
            <span className="text-foreground">See</span>
            <img src={currentLogo} alt="A* AI" className="h-16 sm:h-20 md:h-24 inline-block -mx-2 md:-mx-3 translate-y-[0.1cm]" />
            <span className="text-foreground">in action</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-elevated" style={{ position: 'relative', paddingTop: '62.28%' }}>
            <iframe
              src="https://player.vimeo.com/video/1157200471?badge=0&autopause=0&player_id=0&app_id=58479&loop=1&autoplay=1&muted=1&background=1"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              title="A* AI Demo" />
            
          </div>
        </ScrollReveal>
      </section>

      

      {/* Testimonials Section - Desktop */}
      <section data-section="testimonials" className="hidden md:block py-16 px-8 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className={sectionHeadingClass}>
              <span className="text-foreground">What our </span>
              <span className="text-primary">users</span>
              <span className="text-foreground"> say</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-4">
              Join 2000+ students and teachers achieving real results
            </p>
          </ScrollReveal>

          <div className="flex gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px]">
            <TestimonialsColumn testimonials={firstColumn} duration={45} />
            <TestimonialsColumn testimonials={secondColumn} duration={40} />
            <TestimonialsColumn testimonials={thirdColumn} duration={50} />
          </div>
        </div>
      </section>

      <section className="md:hidden py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-[1.25rem] font-bold leading-[1.2]">
              <span className="text-foreground">What our </span>
              <span className="text-primary">users</span>
              <span className="text-foreground"> say</span>
            </h2>
            <p className="text-muted-foreground text-xs mt-2">Join 2000+ students and teachers achieving real results</p>
          </div>
          <div className="space-y-3">
            {[firstColumn[0], firstColumn[2], firstColumn[6]].map((t, i) =>
            <div key={i} className="relative bg-card rounded-3xl p-5 shadow-card border border-border/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 dark:hidden rounded-3xl pointer-events-none" />
                <p className="text-foreground leading-relaxed text-base">{t.text}</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover object-[center_20%]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{t.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Subject + Plan Selection */}
      <section data-section="pick-subject-bottom" className="py-8 md:py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-8 md:mb-12">
          <h2 className={sectionHeadingClass}>
             <span className="text-foreground">Choose your </span>
             <span className="text-primary">subject</span>
          </h2>
        </ScrollReveal>
        <SubjectPlanSelector />
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 md:px-8 bg-background relative overflow-hidden">
        <HeroBackgroundPaths>
          <div className="max-w-4xl mx-auto relative z-10 px-2 md:px-0">
            <ScrollReveal>
              <h2 className={`${sectionHeadingClass} text-center mb-6`}>
               <span className="text-foreground">Frequently asked </span>
               <span className="text-primary">questions</span>
              </h2>
              <p className="text-center text-muted-foreground mb-8 text-lg">
                Everything you need to know about A* AI and revision.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Accordion type="single" collapsible defaultValue="item-1" className="space-y-4">
                <AccordionItem value="item-1" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger
                    hideIcon
                    className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    
                    <span>Why is this better than ChatGPT or a normal AI?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">
                      ChatGPT knows a bit about everything. A*AI knows everything about your exam - from paper layout to
                      the small tricks that push you towards top grades.
                    </p>
                    <p className="mb-3">
                      Trained on every past paper, mark scheme, and spec point for your board. A personalised 24/7
                      tutor, built specifically for your subject.
                    </p>
                    <p>
                      We handpick A* students from the UK's top universities and train the AI on exactly how they think
                      - the structures, the shortcuts, the phrases examiners reward. The brain of an A* student, powered
                      by AI.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger
                    hideIcon
                    className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    
                    <span>How does it work?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">
                      Pick your subject and start chatting. The AI is trained on your exact specification, past papers,
                      and mark schemes.
                    </p>
                    <p className="mb-3">
                      Use the built-in tools — Diagram Generator, Essay Marker, Past Paper Finder — to practice and get
                      instant feedback.
                    </p>
                    <p>It's like having an A* student available 24/7 to help you revise.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger
                    hideIcon
                    className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    
                    <span>What subjects do you cover?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">
                      We cover Economics (Edexcel, AQA, CIE), Computer Science (OCR), Physics (OCR), Chemistry (AQA),
                      Psychology (AQA) and Mathematics (Edexcel).
                    </p>
                    <p>More subjects dropping soon. Tell us what you need next — we're listening.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-muted rounded-xl border-0 overflow-hidden">
                  <AccordionTrigger
                    hideIcon
                    className="px-6 py-5 text-left font-semibold hover:no-underline text-foreground flex justify-between items-center w-full [&[data-state=open]>svg]:rotate-180 text-lg">
                    
                    <span>Is it really free?</span>
                    <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 shrink-0" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-muted-foreground text-base leading-relaxed">
                    <p className="mb-3">
                      Yes! Create an account and start using all the features for free. No credit card required.
                    </p>
                    <p>
                      For even more training data and priority support, you can upgrade to the Exam Season Pass or
                      Monthly plan.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollReveal>
          </div>
        </HeroBackgroundPaths>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 text-center border-t border-border/30">

        <ScrollReveal className="max-w-4xl mx-auto">

          <p className="text-muted-foreground mb-6">
            A* AI (A Star AI) - Your AI-powered A-Level revision coach for Economics, CS, Physics & more | astarai
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-6 text-muted-foreground">
            <Link to="/compare" className="text-primary hover:text-primary/80 transition-opacity">
              Plans
            </Link>
            <span>•</span>
            <Link to="/#faq" className="text-primary hover:text-primary/80 transition-opacity">
              FAQs
            </Link>
            <span>•</span>
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 transition-opacity"
              onClick={() => window.scrollTo(0, 0)}>
              
              Sign in
            </Link>
            <span>•</span>
            <Link to="/contact" className="text-primary hover:text-primary/80 transition-opacity">
              Contact
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mb-4">Secure checkout via Stripe • Your chats stay private</p>

          <div className="flex justify-center items-center gap-4 mb-6">
            <a
              href="https://www.instagram.com/a.star.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              
              <Instagram size={24} />
            </a>
            <a
              href="https://www.tiktok.com/@a.star.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <a
              href="https://www.youtube.com/@a_star_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              
              <Youtube size={24} />
            </a>
            <a
              href="https://www.linkedin.com/company/astar-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              
              <Linkedin size={24} />
            </a>
            <p className="text-sm text-muted-foreground">© 2025 A* AI</p>
          </div>

          {!user &&
          <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="brand" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          }
        </ScrollReveal>
      </footer>
    </div>);

};