"use client";

import { motion, useAnimation } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AccentColor = "green" | "amber";

interface GridConfig {
  numCards: number;
  cols: number;
  xBase: number;
  yBase: number;
  xStep: number;
  yStep: number;
}

type AnimatedLoadingSkeletonProps = {
  title: string;
  message?: string;
  accentColor?: AccentColor;
};

const easingCurve: [number, number, number, number] = [0.4, 0, 0.2, 1];

const accentTheme: Record<
  AccentColor,
  {
    edge: string;
    badge: string;
    iconColor: string;
    iconGlow: string[];
    panelGradient: string;
    pulse: string[];
  }
> = {
  green: {
    edge: "var(--color-green-600)",
    badge: "var(--color-green-700)",
    iconColor: "var(--color-green-700)",
    iconGlow: [
      "0 0 0 rgba(22, 163, 74, 0.2)",
      "0 0 24px rgba(22, 163, 74, 0.28)",
      "0 0 0 rgba(22, 163, 74, 0.2)",
    ],
    panelGradient: "linear-gradient(140deg, hsl(40 33% 97%) 0%, hsl(40 24% 93%) 100%)",
    pulse: ["hsl(40 30% 95%)", "hsl(38 20% 90%)", "hsl(40 30% 95%)"],
  },
  amber: {
    edge: "var(--color-amber-600)",
    badge: "var(--color-amber-700)",
    iconColor: "var(--color-amber-700)",
    iconGlow: [
      "0 0 0 rgba(217, 119, 6, 0.2)",
      "0 0 24px rgba(217, 119, 6, 0.28)",
      "0 0 0 rgba(217, 119, 6, 0.2)",
    ],
    panelGradient: "linear-gradient(140deg, hsl(40 33% 97%) 0%, hsl(35 28% 92%) 100%)",
    pulse: ["hsl(40 30% 95%)", "hsl(36 22% 89%)", "hsl(40 30% 95%)"],
  },
};

function getGridConfig(width: number): GridConfig {
  const numCards = 6;
  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  return {
    numCards,
    cols,
    xBase: cols === 1 ? 56 : 36,
    yBase: 70,
    xStep: cols === 1 ? 0 : 214,
    yStep: 162,
  };
}

function generateSearchPath(config: GridConfig) {
  const { numCards, cols, xBase, yBase, xStep, yStep } = config;
  const rows = Math.ceil(numCards / cols);
  const positions: Array<{ x: number; y: number }> = [];
  const cardWidth = cols === 1 ? 240 : Math.max(150, xStep - 30);
  const cardHeight = Math.max(92, yStep - 46);
  const iconSafePadding = 26;
  const verticalLift = 24;
  const maxColumnsUsed = Math.min(cols, numCards);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const minX = xBase + iconSafePadding;
  const maxX = xBase + (maxColumnsUsed - 1) * xStep + cardWidth - iconSafePadding;
  const minY = Math.max(14, yBase - verticalLift);
  const maxY = yBase + (rows - 1) * yStep + cardHeight - iconSafePadding - verticalLift;

  for (let row = 0; row < rows; row += 1) {
    const rowPositions: Array<{ x: number; y: number }> = [];
    for (let col = 0; col < cols; col += 1) {
      if (row * cols + col >= numCards) continue;
      const centerX = xBase + col * xStep + cardWidth / 2;
      const centerY = yBase + row * yStep + cardHeight / 2 - verticalLift;
      rowPositions.push({
        x: clamp(centerX, minX, maxX),
        y: clamp(centerY, minY, maxY),
      });
    }
    if (row % 2 === 1) rowPositions.reverse();
    positions.push(...rowPositions);
  }

  if (positions.length === 0) {
    return {
      x: [xBase],
      y: [yBase],
      scale: [1],
      transition: { duration: 1.2, repeat: Infinity, ease: easingCurve },
    };
  }

  const sequence = [...positions];
  sequence.push(sequence[0]);

  return {
    x: sequence.map((position) => position.x),
    y: sequence.map((position) => position.y),
    scale: new Array<number>(sequence.length).fill(1.05),
    transition: {
      duration: Math.max(8.4, sequence.length * 1.35),
      repeat: Infinity,
      ease: easingCurve,
      times: sequence.map((_, index) => index / (sequence.length - 1)),
    },
  };
}

export default function AnimatedLoadingSkeleton({
  title,
  message,
  accentColor = "green",
}: AnimatedLoadingSkeletonProps) {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const controls = useAnimation();
  const theme = accentTheme[accentColor];
  const gridConfig = useMemo(() => getGridConfig(windowWidth), [windowWidth]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    controls.start(generateSearchPath(getGridConfig(windowWidth)));

    return () => {
      controls.stop();
    };
  }, [controls, windowWidth]);

  return (
    <motion.div
      className="w-full max-w-4xl border p-4 shadow-2xl sm:p-6"
      style={{
        borderColor: "var(--border-soft)",
        backgroundColor: "var(--surface-base)",
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.35 } }}
    >
      <div className="mb-4 border-l-2 pl-3 sm:mb-5" style={{ borderColor: theme.edge }}>
        <p
          className="mb-1 text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: theme.badge }}
        >
          Farmesh Processing
        </p>
        <h3 className="font-serif text-2xl leading-tight" style={{ color: "var(--foreground)" }}>
          {title}
        </h3>
        {message && (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
        )}
      </div>

      <div
        className="relative overflow-hidden border p-3 sm:p-4"
        style={{
          borderColor: "var(--border-subtle)",
          background: theme.panelGradient,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.48), transparent 40%)" }}
          aria-hidden="true"
        />

        <motion.div
          className="pointer-events-none absolute z-10 hidden rounded-full p-2 sm:block"
          animate={controls}
          style={{
            left: 16,
            top: 8,
            backgroundColor: "hsl(0 0% 100% / 0.55)",
            backdropFilter: "blur(2px)",
          }}
          aria-hidden="true"
        >
          <motion.div
            animate={{
              boxShadow: theme.iconGlow,
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full p-1.5"
            style={{ backgroundColor: "hsl(0 0% 100% / 0.75)" }}
          >
            <Search className="h-4 w-4" style={{ color: theme.iconColor }} strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: gridConfig.numCards }).map((_, index) => (
            <motion.div
              key={`loading-card-${index}`}
              className="border bg-white/60 p-3"
              style={{ borderColor: "var(--border-subtle)" }}
              initial={{ y: 16, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: { delay: index * 0.08, duration: 0.3 },
              }}
            >
              <motion.div
                className="mb-3 h-18 border"
                style={{ borderColor: "var(--border-subtle)" }}
                animate={{ backgroundColor: theme.pulse }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.div
                className="mb-2 h-3 w-11/12 border"
                style={{ borderColor: "var(--border-subtle)" }}
                animate={{ backgroundColor: theme.pulse }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                className="h-3 w-3/5 border"
                style={{ borderColor: "var(--border-subtle)" }}
                animate={{ backgroundColor: theme.pulse }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
