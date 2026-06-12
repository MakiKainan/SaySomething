import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Caption, Chip, Counter, EASE, rise, Stage, stage, useLoopTick } from "./primitives";

// ─── 02 · Stacked BiLSTM + BiGRU ─────────────────────────────────────────────

const LEMMAS = [
  { from: "don't", to: "do not" },
  { from: "running", to: "run" },
  { from: "ran", to: "run" },
];

/** Step 1 — Clean + lemmatize: expand contractions, reduce to roots, keep "not". */
export function LstmLemmatize() {
  const tick = useLoopTick(5200);
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <motion.div
          key={tick}
          variants={stage}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2.5"
        >
          {LEMMAS.map((r) => (
            <motion.div key={r.from} variants={rise} className="flex items-center gap-3">
              <div className="w-24 text-right">
                <Chip tone="dim">{r.from}</Chip>
              </div>
              <span className="text-white/30">→</span>
              <div className="w-24">
                <Chip tone="hot">{r.to}</Chip>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-1 flex items-center gap-2 border-t border-white/[0.06] pt-3">
          <Caption>stopwords kept</Caption>
          {["no", "not"].map((w) => (
            <motion.span
              key={w}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Chip>{w}</Chip>
            </motion.span>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/** Step 2 — Padding: every comment forced to exactly 200 tokens with zeros. */
export function LstmPadding() {
  const tick = useLoopTick(4600);
  const cells = Array.from({ length: 20 }, (_, i) => i < 8);
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div key={tick} className="flex items-end gap-[3px]">
          {cells.map((isToken, i) => (
            <motion.div
              key={i}
              className={cn(
                "flex h-7 w-3.5 items-center justify-center rounded-[3px] sm:h-8 sm:w-4",
                isToken ? "bg-white/80" : "border border-white/10 bg-white/[0.02]",
              )}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: EASE,
                delay: isToken ? i * 0.05 : 0.5 + (i - 8) * 0.07,
              }}
            >
              {!isToken && <span className="text-[9px] text-white/30">0</span>}
            </motion.div>
          ))}
        </div>

        {/* length bracket */}
        <div className="flex w-full max-w-[280px] flex-col items-center gap-1">
          <div className="h-1.5 w-full border-x border-b border-white/15" />
          <span className="font-serif text-lg italic text-white/70">200 tokens</span>
        </div>

        <div className="flex items-center gap-2">
          <Caption>shorter → padded</Caption>
          <span className="text-white/20">·</span>
          <Caption>longer → truncated</Caption>
        </div>
      </div>
    </Stage>
  );
}

const SEQ = [0.42, 0.7, 0.5, 0.95, 0.6, 0.46, 0.78];
const SEQ_MAX = SEQ.indexOf(Math.max(...SEQ));
const SEQ_AVG = SEQ.reduce((a, b) => a + b, 0) / SEQ.length;

/** Step 3 — BiLSTM/BiGRU read both directions, then max + avg pooling. */
export function LstmStir() {
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <div className="relative flex h-28 w-full items-end justify-center gap-2 sm:h-32">
          {/* avg pooling line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-white/25"
            style={{ bottom: `${SEQ_AVG * 100}%` }}
          >
            <span className="absolute -top-4 right-0 text-[9px] uppercase tracking-widest text-white/40">
              avg
            </span>
          </div>

          {SEQ.map((h, i) => (
            <div key={i} className="relative flex h-full flex-1 items-end">
              <motion.div
                className={cn(
                  "w-full rounded-t-sm",
                  i === SEQ_MAX ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "bg-white/20",
                )}
                initial={{ height: "0%" }}
                animate={{ height: `${h * 100}%` }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.06 }}
              />
              {i === SEQ_MAX && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-white">
                  max
                </span>
              )}
            </div>
          ))}

          {/* forward + backward scans */}
          <motion.span
            aria-hidden
            className="absolute bottom-0 top-0 w-px bg-white/50"
            animate={{ left: ["2%", "98%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
          />
          <motion.span
            aria-hidden
            className="absolute bottom-0 top-0 w-px bg-white/30"
            animate={{ left: ["98%", "2%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Caption>→ forward</Caption>
          <span className="text-white/20">·</span>
          <Caption>← backward</Caption>
          <span className="text-white/20">·</span>
          <Caption>pooling</Caption>
        </div>
      </div>
    </Stage>
  );
}

const IMBALANCE = [
  { k: "toxic", p: 0.93, dead: false },
  { k: "insult", p: 0.86, dead: false },
  { k: "obscene", p: 0.4, dead: false },
  { k: "threat", p: 0.0, dead: true },
  { k: "identity_hate", p: 0.0, dead: true },
];

/** Step 4 — Class imbalance: the net gives up on rare labels (F1 → 0.00). */
export function LstmImbalance() {
  const tick = useLoopTick(5200);
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {/* data proportion */}
        <div className="w-full">
          <div className="mb-1.5 flex items-center justify-between">
            <Caption>training data</Caption>
            <span className="text-[10px] text-white/40">threat = 0.29%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="absolute inset-y-0 left-0 right-[0.29%] bg-white/15" />
            <motion.div
              className="absolute inset-y-0 right-0 w-[3px] bg-white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* per-label outputs */}
        <div key={tick} className="flex w-full flex-col gap-1.5">
          {IMBALANCE.map((l, i) => {
            const delay = 0.15 + i * 0.08;
            return (
              <div key={l.k} className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-24 text-right text-[10px] sm:text-[11px]",
                    l.dead ? "text-[#ff5c5c]/70 line-through" : "text-white/45",
                  )}
                >
                  {l.k}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full", l.p >= 0.5 ? "bg-white" : "bg-white/35")}
                    initial={{ width: "0%" }}
                    animate={{ width: `${l.p * 100}%` }}
                    transition={{ duration: 0.8, ease: EASE, delay }}
                  />
                </div>
                <span
                  className={cn(
                    "w-8 text-right text-[10px] sm:text-[11px]",
                    l.dead ? "text-[#ff5c5c]/80" : "text-white/60",
                  )}
                >
                  <Counter to={l.p} delay={delay} />
                </span>
              </div>
            );
          })}
        </div>

        <motion.div
          className="rounded-md border border-[#ff5c5c]/40 px-3 py-1 text-[10px] uppercase tracking-widest text-[#ff5c5c]/80"
          initial={{ opacity: 0, rotate: -6, scale: 1.2 }}
          animate={{ opacity: 1, rotate: -4, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
        >
          threat F1 = 0.00
        </motion.div>
      </div>
    </Stage>
  );
}
