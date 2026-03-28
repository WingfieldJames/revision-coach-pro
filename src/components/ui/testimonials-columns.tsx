"use client";
import React from "react";
import { motion } from "motion/react";
import matanImage from '@/assets/matan-g.png';
import kathyImage from '@/assets/kathy-kou.png';
import ryanImage from '@/assets/ryan-davies.png';
import alexandruImage from '@/assets/alexandru-leoca.png';
import louisImage from '@/assets/louis-yung.png';
import oliverImage from '@/assets/oliver-mobolaji.png';
import freddieImage from '@/assets/freddie-jones.png';
import mikelImage from '@/assets/mikel-donkor.png';
import dlyetImage from '@/assets/dlyet-tewolde.png';

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 15,
  reverse = false,
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
  reverse?: boolean;
}) => {
  return (
    <div className={`flex-1 ${className || ''}`}>
      <motion.div
        animate={{ translateY: reverse ? "0%" : "-50%" }}
        initial={{ translateY: reverse ? "-50%" : "0%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${index}-${i}`}
                className="relative bg-muted rounded-3xl p-5 shadow-card border border-border/30 overflow-hidden"
              >
                <div className="text-foreground leading-relaxed text-base space-y-2">
                  {text.split('\n\n').map((paragraph, pi) => (
                    <p key={pi}>{paragraph}</p>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover object-[center_20%]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                    <p className="text-sm text-muted-foreground truncate">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

// Master list of all testimonials
const allTestimonials: Testimonial[] = [
  {
    text: "A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
  {
    text: "The 25-marker banded marking gave my essay 23/25 - exactly what my teacher gave it. The improvement tips were detailed and helpful. A* AI massively exceeded my expectations",
    image: ryanImage,
    name: "Ryan Davies",
    role: "Year 13",
  },
  {
    text: "I used an early version of A* AI before its official launch. In those final weeks before the exam it was a lifesaver helping me match my knowledge to exact mark schemes helping me achieve A*s in Econ, Maths and Politics.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
  {
    text: "Got my first ever 12/12 on a 12 marker and then 10/10 today with A*AI's help",
    image: kathyImage,
    name: "Kathy Kou",
    role: "Year 12",
  },
  {
    text: "Having been in the EdTech space for 3+ years this might be one of the most exciting projects I've seen.",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩",
    image: "/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png",
    name: "Lucy W",
    role: "Year 12",
  },
  {
    text: "After using A* AI and reflecting on it with my teachers, we all agreed it was really accurate in terms of marking. The feedback was more detailed than any standard examiner marking. My teacher recommended it to my classmates and said he found it really interesting and valuable!",
    image: louisImage,
    name: "Louis Yung",
    role: "Year 12",
  },
  {
    text: "Diagrams generated instantly, essay feedback I could actually use. This tool will be very useful for achieving a high grade in CS and Maths!",
    image: "",
    name: "Natas Bubelis",
    role: "Year 13",
  },
  {
    text: "Convinced my econ teacher to buy it and use it in our lessons🫡 Showed it to him and he was shocked",
    image: alexandruImage,
    name: "Alexandru Leoca",
    role: "Year 12",
  },
  {
    text: "Bro... I wish I found this sooner. It's perfect.\n\nI've tested the AI chatbot and revision guide maker so far, and they're both highly detailed. They give you what you haven't even thought of asking for, with tailored information.\n\nI'll defo be using this regularly from now on. It's also really clear to use and I think that would help me begin revising econ with an actual structure",
    image: oliverImage,
    name: "Oliver Mobolaji",
    role: "Year 13",
  },
  {
    text: "I actually have an 'Examiner AI' (Tutor2u) subscription but I find the feedback is pretty useless. A*AI actually provides useful and specific feedback for the students.",
    image: freddieImage,
    name: "Freddie Jones",
    role: "Economics Teacher\n@ KCS Wimbledon",
  },
  {
    text: "On the home page, you can see a profile on all the people who built the models on the website. AI often has a conception of being inhumane, kind of robotic and such — that addition adds a more humane feel to it.\n\nThere are also so many different components to this website, and overall it's really great!",
    image: mikelImage,
    name: "Mikel Donkor",
    role: "Year 12",
  },
  {
    text: "This tool is insane. I like how I can put in my target and predicted subjects, and the essay marker too. I'm gonna let my econ teacher know to stop using ChatGPT",
    image: dlyetImage,
    name: "Dlyet Tewolde",
    role: "Year 12",
  },
];

// Each column picks testimonials at staggered offsets so the same person
// never appears at the same vertical position across columns.
// With 13 items, offsets of 0, 5, 9 guarantee max spacing.
const pickAtOffset = (offset: number) =>
  allTestimonials.map((_, i) => allTestimonials[(i + offset) % allTestimonials.length]);

export const firstColumn: Testimonial[] = pickAtOffset(0);
export const secondColumn: Testimonial[] = pickAtOffset(5);
export const thirdColumn: Testimonial[] = pickAtOffset(9);
