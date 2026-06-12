import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Caption, Chip, Counter, EASE, rise, Stage, stage, useLoopTick } from "./primitives";

// ─── 01 · TF-IDF + Logistic Regression ──────────────────────────────────────

/** Step 1 — Tokenization: a knife sweeps the sentence into word/char n-grams. */
export function TfidfTokenize() {
  const tick = useLoopTick(5200);
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <div className="relative px-2">
          <span className="font-serif text-2xl italic text-white/80 sm:text-3xl">
            you idiot
          </span>
          {/* sweeping blade */}
          <motion.span
            aria-hidden
            className="absolute -inset-y-2 w-px bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            initial={{ left: "-10%", opacity: 0 }}
            animate={{ left: ["-10%", "110%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, ease: EASE, repeat: Infinity, repeatDelay: 3.7 }}
          />
        </div>

        <motion.div
          key={tick}
          variants={stage}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-2.5"
        >
          <div className="flex items-center gap-2">
            <Caption className="inline-block w-20 text-right">word n-grams</Caption>
            {["you", "idiot", "you idiot"].map((t) => (
              <motion.div key={t} variants={rise}>
                <Chip>{t}</Chip>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Caption className="inline-block w-20 text-right">char n-grams</Caption>
            {["idi", "dio", "iot"].map((t) => (
              <motion.div key={t} variants={rise}>
                <Chip tone="dim">{t}</Chip>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Stage>
  );
}

const WEIGHTS = [
  { t: "the", w: 0.06, hot: false },
  { t: "is", w: 0.09, hot: false },
  { t: "a", w: 0.05, hot: false },
  { t: "hate", w: 0.82, hot: true },
  { t: "f*ck", w: 0.96, hot: true },
  { t: "ing", w: 0.2, hot: false },
];

/** Step 2 — TF-IDF weighting: common words flatten, rare/sharp tokens spike. */
export function TfidfWeight() {
  const tick = useLoopTick(5000);
  return (
    <Stage>
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <Caption>TF-IDF weight</Caption>
        <div key={tick} className="flex h-32 w-full items-end justify-center gap-3 sm:h-36 sm:gap-4">
          {WEIGHTS.map((tk, i) => (
            <div key={tk.t} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex w-5 flex-1 items-end sm:w-7">
                <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                <motion.div
                  className={cn(
                    "w-full rounded-full",
                    tk.hot ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]" : "bg-white/15",
                  )}
                  initial={{ height: "0%" }}
                  animate={{ height: `${tk.w * 100}%` }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.08 }}
                />
              </div>
              <span className={cn("text-[10px] sm:text-xs", tk.hot ? "text-white/80" : "text-white/30")}>
                {tk.t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

const TASTERS = [
  { k: "toxic", p: 0.94 },
  { k: "severe_toxic", p: 0.12 },
  { k: "obscene", p: 0.34 },
  { k: "threat", p: 0.03 },
  { k: "insult", p: 0.88 },
  { k: "identity_hate", p: 0.06 },
];

/** Step 3 — Six logistic-regression tasters score the weighted vector. */
export function TfidfClassify() {
  const tick = useLoopTick(5400);
  return (
    <Stage>
      <div className="flex w-full max-w-md items-center gap-3 sm:gap-4">
        {/* weighted token vector */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="grid grid-cols-3 gap-1">
            {[0.2, 0.9, 0.3, 0.95, 0.15, 0.5, 0.25, 0.8, 0.1].map((o, i) => (
              <motion.span
                key={i}
                className="h-2.5 w-2.5 rounded-[3px] bg-white"
                animate={{ opacity: [o * 0.5, o, o * 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
            ))}
          </div>
          <Caption>vector</Caption>
        </div>

        {/* connector pulse */}
        <div className="relative h-px flex-[0_0_24px] bg-white/15">
          <motion.span
            className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white"
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* six classifiers */}
        <div key={tick} className="flex flex-1 flex-col gap-1.5">
          {TASTERS.map((l, i) => {
            const hot = l.p >= 0.5;
            const delay = 0.15 + i * 0.09;
            return (
              <div key={l.k} className="flex items-center gap-2">
                <span className="w-[4.5rem] text-right text-[9px] text-white/45 sm:w-24 sm:text-[11px]">
                  {l.k}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full", hot ? "bg-white" : "bg-white/35")}
                    initial={{ width: "0%" }}
                    animate={{ width: `${l.p * 100}%` }}
                    transition={{ duration: 0.9, ease: EASE, delay }}
                  />
                </div>
                <span className={cn("w-8 text-right text-[10px] sm:text-[11px]", hot ? "text-white/80" : "text-white/40")}>
                  <Counter to={l.p} delay={delay} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

/** Step 4 — Context-blind: word order is lost, so both phrases collapse equal. */
export function TfidfBlindspot() {
  const tick = useLoopTick(5000);
  const bag = ["all", "at", "bad", "not"];
  return (
    <Stage>
      <div key={tick} className="relative flex w-full max-w-lg items-center justify-center gap-6 sm:gap-10">
        {[
          { phrase: ["not", "bad", "at", "all"] },
          { phrase: ["bad,", "not", "at", "all"] },
        ].map((col, ci) => (
          <div key={ci} className="flex flex-1 flex-col items-center gap-3">
            <motion.div
              className="flex flex-wrap justify-center gap-1.5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: ci * 0.15 }}
            >
              {col.phrase.map((w, i) => (
                <span key={i}>
                  <Chip tone="dim">{w}</Chip>
                </span>
              ))}
            </motion.div>
            <motion.span
              aria-hidden
              className="text-white/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + ci * 0.15 }}
            >
              ↓
            </motion.span>
            {/* the identical bag-of-words */}
            <motion.div
              className="flex flex-wrap justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.9 + ci * 0.15 }}
            >
              {bag.map((w) => (
                <span key={w}>
                  <Chip>{w}</Chip>
                </span>
              ))}
            </motion.div>
          </div>
        ))}

        {/* equals sign over the divide */}
        <motion.span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-4xl italic text-white sm:text-5xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1], scale: [0.5, 1.15, 1] }}
          transition={{ duration: 0.7, ease: EASE, delay: 1.5 }}
        >
          =
        </motion.span>
      </div>
    </Stage>
  );
}
