"use client";
import React from "react";
import { motion } from "motion/react";
import matanImage from '@/assets/matan-g.png';

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
        animate={{ translateY: reverse ? "-50%" : "0%" }}
        initial={{ translateY: reverse ? "0%" : "-50%" }}
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
                className="bg-card rounded-3xl p-5 shadow-card border border-border/30 aspect-square flex flex-col justify-between"
              >
                <p className="text-foreground leading-relaxed text-sm line-clamp-6">{text}</p>
                <div className="flex items-center gap-3 mt-auto pt-3">
                  <img
                    src={image}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover object-[center_20%]"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{role}</p>
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

// Testimonial data - influencers + students from pricing page
export const firstColumn: Testimonial[] = [
  {
    text: "A* AI has completely transformed how I revise. The diagram generator saves me hours!",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "The Diagram Generator is actually so useful - I use it to find specific diagrams for 25 markers.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
  {
    text: "Finally an AI that understands A-Level Economics mark schemes properly.",
    image: "/lovable-uploads/tanuj-kakumani-updated.jpg",
    name: "Tanuj Kakumani",
    role: "BSc EFDS, Imperial",
  },
  {
    text: "The essay marker gives feedback that actually helps you improve. Game changer.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
];

export const secondColumn: Testimonial[] = [
  {
    text: "The Diagram Generator is genuinely so good - every diagram comes out clean and accurate.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
  {
    text: "Went from predicted B to A* in my mocks. This AI understands the mark scheme.",
    image: "/lovable-uploads/tanuj-kakumani-updated.jpg",
    name: "Tanuj Kakumani",
    role: "BSc EFDS, Imperial",
  },
  {
    text: "Copy-paste formatting is awesome! Makes my essays look professional.",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "Perfect for revision - the feedback on my KAA chains is exactly what I needed.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
];

export const thirdColumn: Testimonial[] = [
  {
    text: "Using A* AI helped me bridge the gap from a B to an A*. Like having a private tutor.",
    image: "/lovable-uploads/tanuj-kakumani-updated.jpg",
    name: "Tanuj Kakumani",
    role: "BSc EFDS, Imperial",
  },
  {
    text: "The diagram explanations are clear and exam-ready. Perfect for revision.",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "Literally the best A-Level tool I've used. The feedback is incredibly detailed.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
  {
    text: "The personalised feedback is like having a private tutor available 24/7.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
];
