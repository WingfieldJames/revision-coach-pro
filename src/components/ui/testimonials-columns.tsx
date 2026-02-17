"use client";
import React from "react";
import { motion } from "motion/react";
import matanImage from '@/assets/matan-g.png';
import kathyImage from '@/assets/kathy-kou.png';
import ryanImage from '@/assets/ryan-davies.png';
import alexandruImage from '@/assets/alexandru-leoca.png';

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
                <p className="text-foreground leading-relaxed text-base">{text}</p>
                <div className="flex items-center gap-3 mt-4">
                  <img
                    src={image}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover object-[center_20%]"
                  />
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

// Real testimonials from students
export const firstColumn: Testimonial[] = [
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
    text: "Convinced my econ teacher to buy it and use it in our lessons🫡 Showed it to him and he was shocked",
    image: alexandruImage,
    name: "Alexandru Leoca",
    role: "Year 12",
  },
];

export const secondColumn: Testimonial[] = [
  {
    text: "Having been in the EdTech space for 3+ years this might be one of the most exciting projects I've seen.",
    image: "/lovable-uploads/40af8c72-163c-49dd-8917-b57f78ed92a9.png",
    name: "Mahmudur Rahman",
    role: "15m views & 1.5m+ likes",
  },
  {
    text: "The 25-marker banded marking gave my essay 23/25 - exactly what my teacher gave it. The improvement tips were detailed and helpful. A* AI massively exceeded my expectations",
    image: ryanImage,
    name: "Ryan Davies",
    role: "Year 13",
  },
  {
    text: "I only started using A* AI a month ago when I started the course but it has already done levels for my econ. Explanation tailored to the spec is super helpful🤩",
    image: "/lovable-uploads/f2b4ccb1-7fe1-48b1-a7d2-be25d9423287.png",
    name: "Lucy W",
    role: "Year 12",
  },
  {
    text: "Got my first ever 12/12 on a 12 marker and then 10/10 today with A*AI's help",
    image: kathyImage,
    name: "Kathy Kou",
    role: "Year 12",
  },
  {
    text: "A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
  {
    text: "I used an early version of A* AI before its official launch. In those final weeks before the exam it was a lifesaver helping me match my knowledge to exact mark schemes helping me achieve A*s in Econ, Maths and Politics.",
    image: "/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png",
    name: "Sina Naderi",
    role: "BA Economics, Cambridge",
  },
  {
    text: "Convinced my econ teacher to buy it and use it in our lessons🫡 Showed it to him and he was shocked",
    image: alexandruImage,
    name: "Alexandru Leoca",
    role: "Year 12",
  },
];

export const thirdColumn: Testimonial[] = [
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
    text: "The 25-marker banded marking gave my essay 23/25 - exactly what my teacher gave it. The improvement tips were detailed and helpful. A* AI massively exceeded my expectations",
    image: ryanImage,
    name: "Ryan Davies",
    role: "Year 13",
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
    text: "A*AI helped me go from a C in my summer mocks to getting predicted an A in November. I used it to get instant feedback on every essay and the diagram generator made a big difference.",
    image: matanImage,
    name: "Matan G",
    role: "Year 13 Student",
  },
  {
    text: "Convinced my econ teacher to buy it and use it in our lessons🫡 Showed it to him and he was shocked",
    image: alexandruImage,
    name: "Alexandru Leoca",
    role: "Year 12",
  },
];
