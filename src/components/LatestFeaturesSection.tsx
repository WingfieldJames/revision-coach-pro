import { useState } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

const features = [
  {
    id: "past-paper",
    title: "📄 Past Paper Mastery",
    description: "Search and retrieve real past paper questions by topic, paper, or command word. A* AI understands how Edexcel organises questions, making practice fully targeted.",
    image: "/features/past-papers.png"
  },
  {
    id: "live-application",
    title: "📰 Live Updated Application",
    description: "The latest examples and case studies — formatted specifically for 25-mark essays in Paper 1 and 2. Updated regularly from global economic news to match Edexcel expectations.",
    image: "/features/essay-marker.png"
  },
  {
    id: "a-star-technique",
    title: "📈 A* Technique",
    description: "From 2 markers to 25 markers, A* AI knows exactly how to structure every response. It guides you through KAA, chains of reasoning and evaluation — so you can write those top band answers that examiners love",
    image: "/features/diagram-generator.png"
  }
];

export function LatestFeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState(features[0].id);
  
  const currentFeature = features.find(f => f.id === selectedFeature) || features[0];

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center max-w-6xl mx-auto gap-12">
      {/* Feature Image */}
      <ScrollReveal direction="left" className="flex-1 text-center">
        <img 
          src={currentFeature.image} 
          alt={currentFeature.title} 
          className="max-w-full h-auto mx-auto rounded-xl shadow-lg transition-all duration-300" 
        />
        <InteractiveHoverButton 
          text="Choose your plan →" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="pointer-events-auto text-base px-6 py-3 w-[220px] bg-white text-foreground border border-border mt-8"
        />
      </ScrollReveal>

      {/* Features */}
      <div className="flex-1 space-y-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setSelectedFeature(feature.id)}
            className={`w-full text-left bg-muted rounded-xl p-6 transition-all duration-300 ${
              selectedFeature === feature.id 
                ? "ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-background" 
                : "hover:bg-muted/80"
            }`}
          >
            <strong className="text-lg font-semibold">{feature.title}</strong>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {feature.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
