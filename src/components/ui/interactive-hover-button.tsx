import React from "react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: "default" | "reverse";
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", variant = "default", className, ...props }, ref) => {
  const isReverse = variant === "reverse";
  
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-32 cursor-pointer overflow-hidden rounded-full border p-2 text-center font-semibold transition-all duration-300",
        isReverse 
          ? "bg-gradient-brand text-white border-transparent glow-brand hover:glow-brand-intense hover:-translate-y-0.5" 
          : "border-white/30 bg-transparent text-white hover:border-[#FF9A2E]",
        className,
      )}
      {...props}
    >
      <div className={cn(
        "absolute left-[50%] top-[50%] h-2 w-2 scale-0 rounded-lg z-0",
        "transition-[left,top,width,height,transform] duration-200 ease-out",
        "group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8]",
        isReverse ? "bg-white/10" : "bg-gradient-brand"
      )}></div>
      <span className={cn(
        "relative z-20 inline-block transition-colors duration-200 ease-out text-white"
      )}>
        {text}
      </span>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
