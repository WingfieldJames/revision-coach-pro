"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

function FloatingPaths({ position }: { position: number }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${800 - i * 8 * position} -${100 + i * 8}C-${
            600 - i * 8 * position
        } ${100 + i * 6} ${200 - i * 6 * position} ${250 - i * 4} ${
            600 - i * 6 * position
        } ${350 - i * 5}C${1000 - i * 6 * position} ${450 - i * 6} ${
            1400 - i * 8 * position
        } ${600 - i * 8} ${1800 - i * 8 * position} ${700 - i * 8}`,
        color: i % 3 === 0 
            ? `rgba(${isDark ? '255, 154, 46' : '147, 51, 234'}, ${0.10 + i * 0.003})`
            : i % 3 === 1
            ? `rgba(${isDark ? '255, 77, 141' : '124, 58, 237'}, ${0.10 + i * 0.003})`
            : `rgba(${isDark ? '255, 200, 61' : '168, 85, 247'}, ${0.10 + i * 0.003})`,
        width: 1 + i * 0.08,
    }));

    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="-200 -400 1800 1200"
            fill="none"
            preserveAspectRatio="none"
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
    );
}

export function ChatbotFullscreenPaths() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
        </div>
    );
}
