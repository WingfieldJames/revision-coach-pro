"use client";

import { motion } from "framer-motion";

function ChatbotFloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        // Extended paths that go well beyond screen edges
        d: `M-${800 - i * 8 * position} -${100 + i * 8}C-${
            600 - i * 8 * position
        } ${100 + i * 6} ${200 - i * 6 * position} ${250 - i * 4} ${
            600 - i * 6 * position
        } ${350 - i * 5}C${1000 - i * 6 * position} ${450 - i * 6} ${
            1400 - i * 8 * position
        } ${600 - i * 8} ${1800 - i * 8 * position} ${700 - i * 8}`,
        // Using exact purple gradient colors from the website
        // Gradient from --primary (#1e3a8a) to --primary-variant (#a855f7)
        color: i % 2 === 0 
            ? `rgba(168, 85, 247, ${0.15 + i * 0.025})` // Purple #a855f7
            : `rgba(30, 58, 138, ${0.12 + i * 0.02})`,  // Blue #1e3a8a
        width: 1 + i * 0.08,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="-200 0 1600 500"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
                style={{ 
                    width: '100vw', 
                    height: '100%',
                    position: 'absolute', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    top: 0
                }}
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={0.8}
                        initial={{ pathLength: 0.3, opacity: 0.5 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.4, 0.8, 0.4],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function ChatbotBackgroundPaths() {
    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-0">
            <ChatbotFloatingPaths position={1} />
            <ChatbotFloatingPaths position={-1} />
        </div>
    );
}
