import React from "react";
import henryLi from "@/assets/henry-li.jpg";
import jamesFounder from "@/assets/james-founder.png";
import tanujKakumani from "@/assets/tanuj-kakumani.jpg";
import yanBeletskiy from "@/assets/yan-beletskiy.png";
import logoMark from "@/assets/logo-mark.png";

const SB = "https://xoipyycgycmpflfnrlty.supabase.co/storage/v1/object/public/trainer-uploads/";
const sb = (path: string) => SB + encodeURI(path);

interface Trainer {
  name: string;
  university: string;
  stats: string;
  image: string;
}

// Exact list + order from Homepage Refined.dc.html
const trainers: Trainer[] = [
  { name: "Zainab Haider", university: "UCL Politics & History", stats: "A-Level: A*A*A*A*", image: sb("3f755502-c3c2-459f-b3e9-52b4f708e493/trainer_image_1775819072740_1773489249873.jpeg") },
  { name: "Naman Tiwari", university: "Imperial CS", stats: "A-Level: A*A*A*A* · 8.9 TMUA · Straight 9s", image: sb("6bd8c73c-249f-4b08-b03d-7b857bab7831/trainer_image_1772193739946_Screenshot 2026-02-27 at 12.01.41.png") },
  { name: "Zoya Siddiqui", university: "UCL Medicine", stats: "A-Level: A*A*AA · GCSE: 11 9s", image: sb("8b5b3c36-34ad-44b2-b73c-414d18fefe8a/trainer_image_1772194171764_Screenshot 2026-02-27 at 12.08.42.png") },
  { name: "Henry Li", university: "LSE PPE", stats: "A-Level: A*A*A*A* · GCSE: 11 9s", image: henryLi },
  { name: "James Wingfield", university: "LSE Management", stats: "A-Level: A*A*A · GCSE: 11 9s", image: jamesFounder },
  { name: "Tanuj Kakumani", university: "Imperial EFDS", stats: "A-Level: A*A*A*AA", image: tanujKakumani },
  { name: "Yan Beletskiy", university: "Warwick Discrete Maths", stats: "A-Level: A*A*A*A*A* · GCSE: 10 9s", image: yanBeletskiy },
  { name: "Tudor Craciun", university: "Imperial CS", stats: "A-Level: A*A*A*A* · GCSEs: Straight 9s", image: sb("7539dc96-eb2e-45be-b5b0-6957dde51974/trainer_image_1772049746995_Screenshot 2026-02-25 at 15.41.22.png") },
  { name: "Fidel Sacoor", university: "SWE Degree Apprentice", stats: "A-Level: A*A*A", image: sb("ded35975-95f4-4657-8bed-cfba5348241b/trainer_image_1775758014677_1757594615280.jpg") },
];

export const TrainersCarousel: React.FC = () => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resetting = React.useRef(false);

  // Render the list three times so the row can loop infinitely.
  const loop = [...trainers, ...trainers, ...trainers];

  const centre = () => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth === 0) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  };

  React.useEffect(() => {
    const t = setTimeout(centre, 100);
    return () => clearTimeout(t);
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || resetting.current) return;
    const setW = el.scrollWidth / 3;
    if (el.scrollLeft < setW * 0.5) {
      resetting.current = true;
      el.scrollLeft += setW;
      requestAnimationFrame(() => (resetting.current = false));
    } else if (el.scrollLeft > setW * 1.5) {
      resetting.current = true;
      el.scrollLeft -= setW;
      requestAnimationFrame(() => (resetting.current = false));
    }
  };

  return (
    <section data-section="founders" className="pt-12 pb-20 bg-muted overflow-hidden">
      <div className="max-w-6xl mx-auto px-8 text-center mb-14">
        <p className="text-base font-medium text-muted-foreground mb-2">Meet your trainers</p>
        <h2 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold leading-[1.2] tracking-tight flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2.5 text-foreground">
            The <img src={logoMark} alt="A*" className="h-[0.85em] w-auto object-contain" /> students
          </span>
          <span className="text-primary">behind the AI</span>
        </h2>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-14 py-4 px-[60px] overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loop.map((tr, i) => (
          <div key={i} className="flex flex-col items-center text-center flex-shrink-0 w-48">
            <div className="group w-40 h-40 rounded-2xl overflow-hidden shadow-lg bg-muted border-4 border-border transition-transform duration-300 hover:scale-105">
              <div
                className="w-full h-full bg-cover"
                style={{ backgroundImage: `url("${tr.image}")`, backgroundPosition: "top" }}
              />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">{tr.name}</h3>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{tr.university}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">{tr.stats}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {trainers.map((_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i === 4 ? "bg-foreground" : "bg-border"}`}
          />
        ))}
      </div>
    </section>
  );
};
