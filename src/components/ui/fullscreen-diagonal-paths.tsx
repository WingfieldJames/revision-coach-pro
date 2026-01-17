"use client";

import { motion } from "framer-motion";

function DiagonalFloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        // Diagonal paths that go from top-left corner to bottom-right corner
        d: `M${-200 + i * 20 * position} ${-100 + i * 15}
            Q${400 + i * 10 * position} ${300 + i * 8} ${800 + i * 15 * position} ${500 + i * 12}
            T${1600 + i * 20 * position} ${1000 + i * 18}
            T${2400 + i * 25 * position} ${1500 + i * 22}`,
        // Using exact purple gradient colors from the website
        color: i % 2 === 0 
            ? `rgba(168, 85, 247, ${0.12 + i * 0.02})` // Purple #a855f7
            : `rgba(30, 58, 138, ${0.10 + i * 0.015})`,  // Blue #1e3a8a
        width: 0.8 + i * 0.07,
    }));

    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1920 1080"
            fill="none"
            preserveAspectRatio="none"
            style={{ 
                width: '100%', 
                height: '100%',
            }}
        >
            <title>Diagonal Background Paths</title>
            {paths.map((path) => (
                <motion.path
                    key={path.id}
                    d={path.d}
                    stroke={path.color}
                    strokeWidth={path.width}
                    strokeOpacity={0.85}
                    fill="none"
                    initial={{ pathLength: 0.3, opacity: 0.4 }}
                    animate={{
                        pathLength: 1,
                        opacity: [0.3, 0.7, 0.3],
                        pathOffset: [0, 1, 0],
                    }}
                    transition={{
                        duration: 18 + Math.random() * 12,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </svg>
    );
}

export function FullscreenDiagonalPaths() {
    return (
        <div 
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{ 
                width: '100vw', 
                height: '100vh',
                top: 0,
                left: 0
            }}
        >
            <DiagonalFloatingPaths position={1} />
            <DiagonalFloatingPaths position={-0.5} />
        </div>
    );
}
