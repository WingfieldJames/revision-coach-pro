import React from "react";
import { motion, useMotionValue, useTransform, useAnimationFrame } from "framer-motion";
import matanImage from "@/assets/matan-g.png";
import kathyImage from "@/assets/kathy-kou.png";
import ryanImage from "@/assets/ryan-davies.png";
import alexandruImage from "@/assets/alexandru-leoca.png";
import louisImage from "@/assets/louis-yung.png";
import oliverImage from "@/assets/oliver-mobolaji.png";
import mikelImage from "@/assets/mikel-donkor.png";
import dlyetImage from "@/assets/dlyet-tewolde.png";

interface RefinedTestimonial {
  pre: string;
  hl: string;
  post: string;
  image: string;
  name: string;
  role: string;
}

// Wording matches the "Homepage Refined" design — each quote has one highlighted phrase.
const testimonials: RefinedTestimonial[] = [
  { pre: "A*AI helped me go ", hl: "from a C in my summer mocks to getting predicted an A", post: " in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.", image: matanImage, name: "Matan G", role: "Year 13 Student" },
  { pre: "The 25-marker banded marking gave my essay 23/25 - ", hl: "exactly what my teacher gave it", post: ". The improvement tips were detailed and helpful. A* AI massively exceeded my expectations", image: ryanImage, name: "Ryan Davies", role: "Year 13" },
  { pre: "I used an early version of A* AI before its official launch. In those final weeks before the exam it was a lifesaver helping me match my knowledge to exact mark schemes helping me ", hl: "achieve A*s in Econ, Maths and Politics", post: ".", image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png", name: "Sina Naderi", role: "BA Economics, Cambridge" },
  { pre: "Got my ", hl: "first ever 12/12 on a 12 marker", post: " and then 10/10 today with A*AI's help", image: kathyImage, name: "Kathy Kou", role: "Year 12" },
  { pre: "Having been in the EdTech space for 3+ years this might be ", hl: "one of the most exciting projects I've seen", post: ".", image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png", name: "Mahmudur Rahman", role: "15m views & 1.5m+ likes" },
  { pre: "I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation ", hl: "tailored to the spec", post: " is super helpful🤩", image: "/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png", name: "Lucy W", role: "Year 12" },
  { pre: "After using A* AI and reflecting on it with my teachers, we all agreed it was really accurate in terms of marking. The feedback was ", hl: "more detailed than any standard examiner marking", post: ". My teacher recommended it to my classmates and said he found it really interesting and valuable!", image: louisImage, name: "Louis Yung", role: "Year 12" },
  { pre: "Diagrams generated instantly, ", hl: "essay feedback I could actually use", post: ". This tool will be very useful for achieving a high grade in CS and Maths!", image: "", name: "Natas Bubelis", role: "Year 13" },
  { pre: "", hl: "Convinced my econ teacher to buy it", post: " and use it in our lessons🫡 Showed it to him and he was shocked", image: alexandruImage, name: "Alexandru Leoca", role: "Year 12" },
  { pre: "Bro... ", hl: "I wish I found this sooner", post: ". It's perfect.\n\nI've tested the AI chatbot and revision guide maker so far, and they're both highly detailed. They give you what you haven't even thought of asking for, with tailored information.", image: oliverImage, name: "Oliver Mobolaji", role: "Year 13" },
  { pre: "On the home page, you can see a profile on all the people who built the models on the website. AI often has a conception of being inhumane — that addition ", hl: "adds a more humane feel", post: " to it.\n\nThere are also so many different components to this website, and overall it's really great!", image: mikelImage, name: "Mikel Donkor", role: "Year 12" },
  { pre: "This tool is insane. I like how I can put in my target and predicted subjects, and the essay marker too. I'm gonna let my econ teacher know to ", hl: "stop using ChatGPT", post: "", image: dlyetImage, name: "Dlyet Tewolde", role: "Year 12" },
];

const initialsOf = (name: string) => name.split(" ").map((n) => n[0]).join("");

// Each column rotates the full list so the same person never lines up across columns.
const pickAtOffset = (offset: number) =>
  testimonials.map((_, i) => testimonials[(i + offset) % testimonials.length]);

const TestimonialCard: React.FC<{ t: RefinedTestimonial }> = ({ t }) => (
  <div className="relative bg-card rounded-[20px] p-[22px] border border-border/60 shadow-[0_1px_3px_rgba(24,18,50,0.05),0_8px_24px_hsl(var(--primary)/0.05)]">
    <span className="absolute top-2.5 right-[18px] text-[44px] font-extrabold leading-none select-none text-primary/[0.13] pointer-events-none">*</span>
    <p className="m-0 text-[15.5px] leading-relaxed text-foreground/90 whitespace-pre-line">
      {t.pre}
      <span
        className="rounded-[2px] px-px font-semibold"
        style={{ background: "linear-gradient(transparent 55%, hsl(var(--primary) / 0.18) 55%)" }}
      >
        {t.hl}
      </span>
      {t.post}
    </p>
    <div className="flex items-center gap-3 mt-4">
      {t.image ? (
        <div
          className="w-10 h-10 rounded-full bg-cover"
          style={{
            backgroundImage: `url("${t.image}")`,
            backgroundPosition: "center 20%",
            boxShadow: "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary) / 0.25)",
          }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-semibold text-[13px] bg-primary/15"
          style={{ boxShadow: "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary) / 0.25)" }}
        >
          {initialsOf(t.name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="m-0 font-semibold text-sm text-foreground truncate">{t.name}</p>
        <p className="m-0 text-[13px] text-muted-foreground truncate">{t.role}</p>
      </div>
    </div>
  </div>
);

// Vertical marquee. Renders the list twice; loops one half-height. Pauses on hover.
const MarqueeColumn: React.FC<{ items: RefinedTestimonial[]; duration: number }> = ({ items, duration }) => {
  const yPct = useMotionValue(0);
  const [paused, setPaused] = React.useState(false);
  useAnimationFrame((_t, delta) => {
    if (paused) return;
    const distancePerMs = 50 / (duration * 1000);
    let next = yPct.get() - distancePerMs * delta;
    if (next <= -50) next += 50;
    yPct.set(next);
  });
  const yStyle = useTransform(yPct, (v) => `${v}%`);
  return (
    <div
      className="flex-1 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div style={{ y: yStyle, willChange: "transform" }} className="flex flex-col gap-4">
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {items.map((t, i) => (
              <TestimonialCard key={`${copy}-${i}`} t={t} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export const WallOfLove: React.FC = () => {
  const col1 = pickAtOffset(0);
  const col2 = pickAtOffset(5);
  const col3 = pickAtOffset(9);
  return (
    <section
      data-section="testimonials"
      className="py-16 md:py-[88px] px-8 overflow-hidden bg-gradient-to-b from-background via-primary/[0.035] to-background"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3.5 mb-[18px]">
            <span className="inline-block w-8 h-px bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.18em] uppercase text-primary">Wall of love</span>
            <span className="inline-block w-8 h-px bg-primary/40" />
          </div>
          <h2 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold leading-[1.2] tracking-tight text-foreground">
            10,000 students.<br />
            One{" "}
            <span className="relative inline-block whitespace-nowrap">
              unfair advantage
              <svg viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute left-0 -bottom-2.5 w-full h-3.5 overflow-visible">
                <path d="M4 9 C 60 2, 130 3, 158 6 C 200 10, 255 9, 296 4" stroke="hsl(var(--primary))" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
              </svg>
            </span>
          </h2>
          <p className="text-[17px] text-muted-foreground mt-[26px]">Straight from our DMs — unedited.</p>
        </div>

        <div className="flex gap-4 max-h-[620px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <MarqueeColumn items={col1} duration={45} />
          <MarqueeColumn items={col2} duration={40} />
          <MarqueeColumn items={col3} duration={50} />
        </div>
      </div>
    </section>
  );
};
