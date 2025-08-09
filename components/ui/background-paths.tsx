"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface Point {
    x: number;
    y: number;
}

interface PathData {
    id: string;
    d: string;
    opacity: number;
    width: number;
    duration: number;
    delay: number;
}

// Path generation function
function generateAestheticPath(
    index: number,
    position: number,
    type: "primary" | "secondary" | "accent"
): string {
    const baseAmplitude =
        type === "primary" ? 150 : type === "secondary" ? 100 : 60;
    const phase = index * 0.2;
    const points: Point[] = [];
    const segments = type === "primary" ? 10 : type === "secondary" ? 8 : 6;

    const startX = 2400;
    const startY = 800;
    const endX = -2400;
    const endY = -800 + index * 25;

    for (let i = 0; i <= segments; i++) {
        const progress = i / segments;
        const eased = 1 - (1 - progress) ** 2;

        const baseX = startX + (endX - startX) * eased;
        const baseY = startY + (endY - startY) * eased;

        const amplitudeFactor = 1 - eased * 0.3;
        const wave1 =
            Math.sin(progress * Math.PI * 3 + phase) *
            (baseAmplitude * 0.7 * amplitudeFactor);
        const wave2 =
            Math.cos(progress * Math.PI * 4 + phase) *
            (baseAmplitude * 0.3 * amplitudeFactor);
        const wave3 =
            Math.sin(progress * Math.PI * 2 + phase) *
            (baseAmplitude * 0.2 * amplitudeFactor);

        points.push({
            x: baseX * position,
            y: baseY + wave1 + wave2 + wave3,
        });
    }

    const pathCommands = points.map((point: Point, i: number) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        const prevPoint = points[i - 1];
        const tension = 0.4;
        const cp1x = prevPoint.x + (point.x - prevPoint.x) * tension;
        const cp1y = prevPoint.y;
        const cp2x = prevPoint.x + (point.x - prevPoint.x) * (1 - tension);
        const cp2y = point.y;
        return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    });

    return pathCommands.join(" ");
}

const generateUniqueId = (prefix: string): string =>
    `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Memoized FloatingPaths component
const FloatingPaths = memo(function FloatingPaths({
    position,
}: {
    position: number;
}) {
    const primaryPaths: PathData[] = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                id: generateUniqueId("primary"),
                d: generateAestheticPath(i, position, "primary"),
                opacity: 0.08 + i * 0.01,
                width: 2 + i * 0.2,
                duration: 25,
                delay: i * 0.5,
            })),
        [position]
    );

    const secondaryPaths: PathData[] = useMemo(
        () =>
            Array.from({ length: 15 }, (_, i) => ({
                id: generateUniqueId("secondary"),
                d: generateAestheticPath(i, position, "secondary"),
                opacity: 0.06 + i * 0.008,
                width: 1.5 + i * 0.15,
                duration: 20,
                delay: i * 0.3,
            })),
        [position]
    );

    const accentPaths: PathData[] = useMemo(
        () =>
            Array.from({ length: 10 }, (_, i) => ({
                id: generateUniqueId("accent"),
                d: generateAestheticPath(i, position, "accent"),
                opacity: 0.04 + i * 0.006,
                width: 1 + i * 0.1,
                duration: 15,
                delay: i * 0.2,
            })),
        [position]
    );

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
                className="w-full h-full"
                viewBox="-2400 -800 4800 1600"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <linearGradient
                        id="insightraGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#49EACB" />
                        <stop offset="50%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                </defs>

                <g className="primary-waves">
                    {primaryPaths.map((path, index) => (
                        <motion.path
                            key={path.id}
                            d={path.d}
                            stroke="url(#insightraGradient)"
                            strokeWidth={path.width}
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: path.opacity,
                                y: [0, -20, 0],
                                x: [0, 10, 0],
                            }}
                            transition={{
                                opacity: { duration: 2, delay: path.delay },
                                y: {
                                    duration: 8 + index * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                                x: {
                                    duration: 12 + index * 0.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                            }}
                        />
                    ))}
                </g>

                <g className="secondary-waves">
                    {secondaryPaths.map((path, index) => (
                        <motion.path
                            key={path.id}
                            d={path.d}
                            stroke="url(#insightraGradient)"
                            strokeWidth={path.width}
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: path.opacity,
                                y: [0, -15, 0],
                                x: [0, -8, 0],
                            }}
                            transition={{
                                opacity: { duration: 2, delay: path.delay },
                                y: {
                                    duration: 6 + index * 0.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                                x: {
                                    duration: 10 + index * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                            }}
                        />
                    ))}
                </g>

                <g className="accent-waves">
                    {accentPaths.map((path, index) => (
                        <motion.path
                            key={path.id}
                            d={path.d}
                            stroke="url(#insightraGradient)"
                            strokeWidth={path.width}
                            strokeLinecap="round"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: path.opacity,
                                y: [0, -10, 0],
                                x: [0, 5, 0],
                            }}
                            transition={{
                                opacity: { duration: 2, delay: path.delay },
                                y: {
                                    duration: 4 + index * 0.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                                x: {
                                    duration: 8 + index * 0.1,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatType: "reverse",
                                },
                            }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
});

export default memo(function BackgroundPaths() {
    return (
        <div className="fixed inset-0 z-0">
            <FloatingPaths position={1} />
        </div>
    );
});
