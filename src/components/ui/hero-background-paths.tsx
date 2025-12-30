"use client";

import { motion } from "framer-motion";

function HeroFloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 28 }, (_, i) => ({
        id: i,
        // More horizontal, sweeping wave pattern that flows through the hero - shifted up
        d: `M-${1000 - i * 15 * position} ${80 + i * 10 + Math.sin(i * 0.5) * 25}C-${
            600 - i * 12 * position
        } ${100 + i * 8 + Math.cos(i * 0.3) * 35} ${100 + i * 8 * position} ${
            130 + i * 7 + Math.sin(i * 0.4) * 30
        } ${500 + i * 10 * position} ${110 + i * 8}C${900 + i * 12 * position} ${
            90 + i * 10 + Math.cos(i * 0.5) * 25
        } ${1400 + i * 10 * position} ${140 + i * 6} ${2200 + i * 15 * position} ${
            100 + i * 12 + Math.sin(i * 0.6) * 20
        }`,
        // Using exact purple gradient colors from the website
        color: i % 2 === 0 
            ? `rgba(168, 85, 247, ${0.12 + i * 0.02})` // Purple #a855f7
            : `rgba(30, 58, 138, ${0.10 + i * 0.015})`,  // Blue #1e3a8a
        width: 0.8 + i * 0.06,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
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
            <div className="relative z-10 max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
}
