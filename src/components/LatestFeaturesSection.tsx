import { useState } from "react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: "diagram-generator",
    title: "📊 Diagram Generator",
    description: "Paste any question and instantly get the exact diagram you need - AD/AS, supply and demand, market failure, and more. AI-powered, so it understands context, not just keywords.",
    image: "/features/diagram-generator.png"
  },
  {
    id: "past-paper",
    title: "📄 Past Paper Mastery",
    description: "Search and retrieve real past paper questions by topic, paper, or command word. Trained on every exam from 2017-2024, so your practice is always exam-focused.",
    image: "/features/past-papers.png"
  },
  {
    id: "essay-marker",
    title: "✍️ A* Technique and Essay Marker",
    description: "Upload your essays and get instant feedback against real mark schemes. Learn the exact structures, evaluation phrases, and timing tricks that A* students use.",
    image: "/features/essay-marker.png"
  }
];

export function LatestFeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState(features[0].id);
  
  const currentFeature = features.find(f => f.id === selectedFeature) || features[0];

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto gap-8">
      {/* Feature Image with animation */}
      <ScrollReveal className="w-full text-center">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentFeature.id}
            src={currentFeature.image} 
            alt={currentFeature.title} 
            className="max-w-full h-auto mx-auto rounded-xl shadow-lg" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      </ScrollReveal>

      {/* Features with stagger animation */}
      <StaggerContainer className="w-full space-y-4">
        {features.map((feature) => (
          <StaggerItem key={feature.id}>
            <button
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
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Choose your plan button */}
      <ScrollReveal>
        <InteractiveHoverButton 
          text="Choose your plan →" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="pointer-events-auto text-base px-6 py-3 w-[220px] bg-white text-foreground border border-border mt-4"
        />
      </ScrollReveal>
    </div>
  );
}
