import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useDepth } from "../lib/depth";
import { cn } from "../lib/utils";
import { LABELS, pretty } from "../utils/models";

const EASE = [0.16, 1, 0.3, 1] as const;
const TOKENS = ["honestly", "you", "are", "such", "an", "idiot"];
// Illustrative attention from "idiot" to every token (sums to 1).
const ATTN = [0.04, 0.46, 0.07, 0.16, 0.05, 0.22];
// Illustrative final scores for the sample sentence.
const OUT: Record<string, number> = { toxic: 0.94, severe_toxic: 0.11, obscene: 0.38, threat: 0.02, insult: 0.89, identity_hate: 0.01 };

// Deterministic fake embedding values so the "vectors" don't reshuffle on re-render.
const vec = (i: number, j: number) => ((Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 + 1) % 1;

const STEPS = [
  {
    title: "Chop it into tokens",
    simple: "Computers can't read sentences, so we cut the comment into small pieces called tokens, usually words or parts of words.",
    tech: "Tokenization. TF-IDF uses word + character n-grams, the LSTM a word index, and the transformers subword units (WordPiece / byte-level BPE), so unseen words still map to known pieces.",
  },
  {
    title: "Turn tokens into numbers",
    simple: "Each token becomes a list of numbers, like a fingerprint. Words with similar meaning get similar fingerprints.",
    tech: "Vectorization. Sparse TF-IDF weights tf·log(N/df), or dense learned embeddings: 128-d for the LSTM, 768-d for the transformers. Shown here: 6 of those dimensions.",
  },
  {
    title: "Read the context",
    simple: "The model checks how words relate. Here \"idiot\" is aimed at \"you\", which is what makes it an insult and not just a word.",
    tech: "Contextual encoding. Self-attention computes softmax(QKᵀ/√d)·V, so every token mixes information from every other one. Brightness = attention weight from \"idiot\". TF-IDF skips this step entirely.",
  },
  {
    title: "Score six kinds of toxicity",
    simple: "Finally it gives a score from 0 to 100% for six labels. Above 50% counts as yes, and a comment can be several things at once.",
    tech: "Six independent sigmoid heads (multi-label, not softmax, so scores needn't sum to 1), trained with pos_weight-weighted binary cross-entropy and thresholded at 0.5.",
  },
];

export function HowItWorks() {
  const { t } = useDepth();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduced = useReducedMotion();

  // Auto-advance while visible, until the reader takes control.
  useEffect(() => {
    if (!inView || paused || reduced) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 4200);
    return () => clearTimeout(id);
  }, [inView, paused, reduced, step]);

  const choose = (i: number) => {
    setPaused(true);
    setStep(i);
  };

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
      <ol className="lg:col-span-5 flex flex-col gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => choose(i)}
              aria-current={step === i ? "step" : undefined}
              className={cn(
                "relative w-full text-left rounded-2xl border p-4 md:p-5 transition-colors cursor-pointer overflow-hidden",
                step === i ? "border-white/25 bg-white/[0.06]" : "border-white/5 hover:border-white/15",
              )}
            >
              {step === i && !paused && !reduced && inView && (
                <motion.span
                  key={`bar-${step}`}
                  aria-hidden
                  className="absolute left-0 top-0 h-0.5 bg-white/60"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.2, ease: "linear" }}
                />
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-xs tabular-nums text-white/55">0{i + 1}</span>
                <span className={cn("font-medium", step === i ? "text-white" : "text-white/70")}>{s.title}</span>
              </div>
              <AnimatePresence initial={false}>
                {step === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="text-sm leading-relaxed text-white/70 pl-8 overflow-hidden"
                  >
                    <span className="block pt-2">{t(s.simple, s.tech)}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          </li>
        ))}
      </ol>

      <figure
        className="lg:col-span-7 relative rounded-2xl border border-white/10 bg-black overflow-hidden min-h-[340px] flex flex-col"
        aria-label={`Step ${step + 1}: ${STEPS[step].title}`}
      >
        <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.06]" />
        <div className="relative flex-1 flex flex-col items-center justify-center gap-8 p-6">
          <div className="text-white/55 text-xs uppercase tracking-widest">
            “honestly you are such an idiot”
          </div>

          <div className="flex flex-wrap justify-center gap-x-2 gap-y-4">
            {TOKENS.map((tok, i) => (
              <div key={tok} className="flex flex-col items-center gap-2">
                <motion.span
                  layout
                  animate={{
                    opacity: step === 2 ? 0.35 + ATTN[i] * 1.4 : 1,
                    scale: step === 0 ? [0.9, 1] : 1,
                  }}
                  transition={{ duration: 0.5, ease: EASE, delay: step === 0 ? i * 0.07 : 0 }}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-sm",
                    step === 2 && i === 5 ? "bg-white text-black border-white" : "border-white/20 bg-white/[0.05] text-white",
                  )}
                  style={step === 2 && i !== 5 ? { boxShadow: `0 0 ${ATTN[i] * 60}px rgba(255,255,255,${ATTN[i]})` } : undefined}
                >
                  {tok}
                </motion.span>

                <AnimatePresence mode="popLayout">
                  {step === 1 && (
                    <motion.div
                      key="vec"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="flex flex-col gap-0.5"
                    >
                      {Array.from({ length: 6 }, (_, j) => (
                        <span
                          key={j}
                          className="block w-7 h-3 rounded-sm text-[8px] leading-3 text-center tabular-nums text-black/70"
                          style={{ background: `rgba(255,255,255,${0.12 + vec(i, j) * 0.8})` }}
                        >
                          {(vec(i, j) * 2 - 1).toFixed(1)}
                        </span>
                      ))}
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.span
                      key="attn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] tabular-nums text-white/60"
                    >
                      {i === 5 ? "query" : ATTN[i].toFixed(2)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 3 && (
              <motion.div
                key="scores"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-sm space-y-2"
              >
                {LABELS.map((l, i) => (
                  <div key={l} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-xs">
                    <span className="text-white/70 capitalize">{pretty(l)}</span>
                    <span className="relative h-1.5 rounded-full bg-white/10">
                      <span aria-hidden className="absolute left-1/2 -top-1 -bottom-1 w-px bg-white/30" />
                      <motion.span
                        className={cn("absolute inset-y-0 left-0 rounded-full", OUT[l] > 0.5 ? "bg-red-400" : "bg-white/80")}
                        initial={{ width: 0 }}
                        animate={{ width: `${OUT[l] * 100}%` }}
                        transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.06 }}
                      />
                    </span>
                    <span className={cn("tabular-nums text-right", OUT[l] > 0.5 ? "text-white" : "text-white/60")}>
                      {Math.round(OUT[l] * 100)}%
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-white/55 pt-1">Line in the middle = the 50% threshold.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <figcaption className="relative px-6 pb-4 text-[11px] text-white/50">
          Illustration. For real scores, try the live demo.
        </figcaption>
      </figure>
    </div>
  );
}
