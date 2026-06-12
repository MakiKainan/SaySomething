import { motion } from "motion/react";
import type { StepMedia as StepMediaType } from "../utils/pipelines";
import { pipelineVisuals } from "./pipeline-visuals";

/**
 * Renders the animated asset in the middle of an Enlighten Me step.
 * Asset-format-agnostic: bespoke `component` visuals (the default) render from
 * the pipelineVisuals registry; GIF/video render natively; Lottie and unknown
 * keys fall back to the placeholder.
 */
export function StepMedia({ media, label }: { media: StepMediaType; label?: string }) {
  if (media.type === "component" && media.key) {
    const Visual = pipelineVisuals[media.key];
    if (Visual) return <Visual />;
  }

  if (media.type === "gif" && media.src) {
    return (
      <img
        src={media.src}
        alt={media.alt ?? label ?? ""}
        className="w-full h-full object-contain"
      />
    );
  }

  if (media.type === "video" && media.src) {
    return (
      <video
        src={media.src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain"
      />
    );
  }

  // placeholder (and lottie-without-player) — styled, on-brand, gently animated.
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.03]"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="bg-noise absolute inset-0 opacity-[0.15]" aria-hidden />
      <div className="relative flex flex-col items-center gap-3 text-center px-6">
        <motion.div
          className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-serif text-2xl text-white/60 italic">*</span>
        </motion.div>
        <span className="text-white/30 text-[10px] uppercase tracking-widest">
          Visual coming soon
        </span>
      </div>
    </div>
  );
}
