"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Central hub visualization */}
      <div className="relative flex flex-col items-center">
        {/* Feature cards in a circular/radial layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {timelineData.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            
            // Make the middle item (index 2) span full width on md for centering
            const isCenter = index === 2;
            
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative bg-card border border-border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-elevated hover:border-primary/30",
                  isActive && "ring-2 ring-primary shadow-elevated border-primary/50",
                  isCenter && "md:col-span-1"
                )}
                onClick={() => setActiveId(isActive ? null : item.id)}
              >
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>

                {/* Content - shown when active or on hover */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300",
                  isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100"
                )}>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.content}
                  </p>
                </div>

                {/* Expand indicator */}
                <div className={cn(
                  "absolute bottom-4 right-4 w-6 h-6 rounded-full bg-muted flex items-center justify-center transition-transform duration-300",
                  isActive && "rotate-180"
                )}>
                  <svg 
                    className="w-4 h-4 text-muted-foreground" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
