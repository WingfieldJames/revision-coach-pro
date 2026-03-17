"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useMemo } from "react";

const ACHIEVEMENT_STATS = [
  "4 A*s", "Straight 9s", "99 UMS", "Top 1%",
  "A*A*A*A*", "200/200", "Full marks", "8.9 TMUA",
];

function FloatingAchievements() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const items = useMemo(() => {
    const result: Array<{
      label: string;
      x: number;
      duration: number;
      delay: number;
      fontSize: number;
    }> = [];

    ACHIEVEMENT_STATS.forEach((label, i) => {
      const side = i % 2 === 0 ? "left" : "right";
      const x = side === "left"
        ? 1 + (i * 3.7) % 10
        : 89 + (i * 2.9) % 10;
      result.push({
        label,
        x,
        duration: 16 + (i * 3.7) % 8,
        delay: (i * 2.3) % 12,
        fontSize: 12 + (i % 3),
      });
    });

    return result;
  }, []);

  const color = isDark
    ? "rgba(168, 85, 247, 0.12)"
    : "rgba(79, 54, 179, 0.13)";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
      {items.map((item, i) => (
        <motion.span
          key={i}
          className="absolute font-semibold select-none whitespace-nowrap"
          style={{
            left: `${item.x}%`,
            color,
            fontSize: `${item.fontSize}px`,
          }}
          initial={{ bottom: "-5%", opacity: 0 }}
          animate={{
            bottom: ["-5%", "110%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.05, 0.9, 1],
          }}
        >
          {item.label}
        </motion.span>
      ))}
    </div>
  );
}

function HeroFloatingPaths({ position, mobileOnly = false }: { position: number; mobileOnly?: boolean }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const paths = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        d: `M-${1000 - i * 15 * position} ${110 + i * 11 + Math.sin(i * 0.5) * 28}C-${
            600 - i * 12 * position
        } ${140 + i * 9 + Math.cos(i * 0.3) * 38} ${100 + i * 8 * position} ${
            170 + i * 7 + Math.sin(i * 0.4) * 32
        } ${500 + i * 10 * position} ${150 + i * 9}C${900 + i * 12 * position} ${
            130 + i * 11 + Math.cos(i * 0.5) * 28
        } ${1400 + i * 10 * position} ${180 + i * 7} ${2200 + i * 15 * position} ${
            140 + i * 13 + Math.sin(i * 0.6) * 22
        }`,
        color: isDark
            ? (i % 2 === 0 ? `rgba(255, 154, 46, ${0.04 + i * 0.003})` : `rgba(255, 77, 141, ${0.04 + i * 0.003})`)
            : `rgba(79, 54, 179, ${0.03 + i * 0.002})`,
        width: 0.6 + i * 0.04,
    }));

    const visibilityClass = mobileOnly ? "block md:hidden" : "hidden md:block";

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-visible ${visibilityClass}`}>
            <svg
                className="w-full h-full"
                viewBox="-400 0 2000 500"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
                style={{ 
                    minWidth: '120vw', 
                    position: 'absolute', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    top: 0,
                    height: '100%'
                }}
            >
                <title>Hero Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={0.9}
                        initial={{ pathLength: 0.3, opacity: 0.4 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.7, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 15,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function HeroBackgroundPaths({ children }: { children?: React.ReactNode }) {
    return (
        <div className="relative w-screen overflow-visible" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
            <HeroFloatingPaths position={1} />
            <HeroFloatingPaths position={-1} />
            <HeroFloatingPaths position={1} mobileOnly />
            <HeroFloatingPaths position={-1} mobileOnly />
            <FloatingAchievements />
            <div className="relative z-10 max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
}
