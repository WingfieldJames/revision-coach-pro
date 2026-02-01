"use client";
import React from "react";
import { motion } from "motion/react";

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
}: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${index}-${i}`}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
              >
                <p className="text-muted-foreground leading-relaxed">{text}</p>
                <div className="flex items-center gap-3 mt-4">
                  <img
                    src={image}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
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

// Testimonial data combining influencers and student reviews
export const testimonials: Testimonial[] = [
  {
    text: "A* AI has completely transformed how I revise. The diagram generator saves me hours and the essay feedback is incredibly detailed.",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "The Diagram Generator is genuinely so good - every diagram comes out clean and accurate. Makes revision so much easier.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
  {
    text: "Using A* AI helped me bridge the gap from a B to an A*. The personalised feedback is like having a private tutor.",
    image: "/lovable-uploads/tanuj-kakumani-updated.jpg",
    name: "Tanuj Kakumani",
    role: "BSc EFDS, Imperial",
  },
  {
    text: "Literally the best A-Level tool I've used. The essay marker gives feedback that actually helps you improve.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Zara Ahmed",
    role: "Year 13 Student",
  },
  {
    text: "Copy-paste formatting is awesome! Makes my essays look professional and saves so much time.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Pawel K.",
    role: "A-Level Economics",
  },
  {
    text: "This AI understands the mark scheme better than most teachers. Went from predicted B to A* in my mocks.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Maisam Hussain",
    role: "Year 13 Student",
  },
  {
    text: "The diagram explanations are clear and exam-ready. Perfect for last-minute revision sessions.",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    name: "Aryaan R.",
    role: "Year 12 Student",
  },
  {
    text: "Finally an AI that actually knows A-Level Economics. The KAA chains it generates are spot on.",
    image: "https://randomuser.me/api/portraits/women/89.jpg",
    name: "Sophie Chen",
    role: "A* Economics Student",
  },
  {
    text: "Used this for my entire Year 13. Best investment I made for my A-Levels by far.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    name: "David O.",
    role: "LSE Offer Holder",
  },
];

export const firstColumn = testimonials.slice(0, 3);
export const secondColumn = testimonials.slice(3, 6);
export const thirdColumn = testimonials.slice(6, 9);
