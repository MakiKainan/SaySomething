import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { StepMedia } from "./StepMedia";
import type { PipelineStep } from "../utils/pipelines";

const EASE: number[] = [0.16, 1, 0.3, 1];

type ModelInfo = { id: string; name: string; type: string };

export function EnlightenModal({
  model,
  steps,
  onClose,
}: {
  model: ModelInfo;
  steps: PipelineStep[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  // direction drives the slide animation (+1 next, -1 prev)
  const [direction, setDirection] = useState(0);

  const total = steps.length;
  const hasSteps = total > 0;

  const go = (next: number) => {
    if (next < 0 || next > total - 1) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(step + 1);
      else if (e.key === "ArrowLeft") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, total]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const current = steps[step];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Window */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${model.name} pipeline`}
        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.5, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-white/20 text-xs">{model.id}</span>
              <span className="border border-white/15 text-white/50 text-[10px] rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                {model.type}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-white leading-snug">
              {model.name}
            </h3>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {hasSteps && (
              <span className="text-white/30 text-xs tabular-nums tracking-wider">
                {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {hasSteps ? (
          <>
            {/* Carousel body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {/* Media stage (middle) */}
                  <div className="rounded-xl overflow-hidden border border-white/5 bg-black aspect-video mb-6">
                    <StepMedia media={current.media} label={current.title} />
                  </div>

                  {/* Explanation (bottom) */}
                  <div className="text-white/30 text-[10px] uppercase tracking-widest mb-2">
                    Step {step + 1}
                  </div>
                  <h4 className="text-white text-lg font-medium mb-3">
                    {current.title}
                  </h4>
                  <p className="text-white/55 text-sm md:text-base leading-relaxed">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 border-t border-white/5">
              <button
                onClick={() => go(step - 1)}
                disabled={step === 0}
                aria-label="Previous step"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white disabled:opacity-25 disabled:hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === step ? "w-6 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>

              {step === total - 1 ? (
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-black bg-white rounded-full px-5 py-2 hover:bg-white/90 transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={() => go(step + 1)}
                  aria-label="Next step"
                  className="flex items-center gap-2 text-sm font-medium text-black bg-white rounded-full px-5 py-2 hover:bg-white/90 transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          // Safety-net fallback (all 4 models ship with content)
          <div className="px-8 py-20 text-center">
            <p className="text-white/40 text-sm">
              Pipeline walkthrough coming soon.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
