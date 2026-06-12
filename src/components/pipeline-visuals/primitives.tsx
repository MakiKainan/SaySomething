import { useEffect, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "../../lib/utils";

// Shared building blocks for the animated "Enlighten Me" pipeline visuals.
// Everything here speaks the SaySomething dialect: monochrome on black, the
// signature easing curve, grain, serif accents, and staggered entrances.

export const EASE = [0.16, 1, 0.3, 1] as const;

// Staggered-entrance variants (the house pattern). Re-key a subtree to replay.
export const stage = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * A small periodic counter. Bumps every `period` ms so keyed subtrees remount
 * and replay their entrance — keeps a visual breathing while a step is open.
 */
export function useLoopTick(period = 5200) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), period);
    return () => clearInterval(id);
  }, [period]);
  return tick;
}

/** 16:9 dark stage matching the modal's media frame, with brand grain + glow. */
export function Stage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]"
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.08]" />
      <div
        className={cn(
          "relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Token pill — the recurring unit across most pipeline visuals. */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "dim" | "hot" | "solid";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium leading-none tracking-tight sm:text-xs",
        tone === "default" && "border-white/15 bg-white/[0.04] text-white/70",
        tone === "dim" && "border-white/[0.07] bg-transparent text-white/25",
        tone === "hot" && "border-white/40 bg-white/10 text-white",
        tone === "solid" && "border-white bg-white text-black",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Micro caption — mirrors the modal's uppercase tracking-widest labels. */
export function Caption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[9px] uppercase tracking-widest text-white/30 sm:text-[10px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Animated number that counts toward `to`. Re-mount (via key) to replay. */
export function Counter({
  to,
  decimals = 2,
  duration = 1.1,
  delay = 0,
  prefix = "",
  suffix = "",
}: {
  to: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
}) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    const controls = animate(value, to, { duration, delay, ease: EASE });
    return () => controls.stop();
  }, [to, duration, delay, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}
