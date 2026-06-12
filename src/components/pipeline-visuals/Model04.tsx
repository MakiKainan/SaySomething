import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Caption, Chip, Counter, EASE, Stage, useLoopTick } from "./primitives";

// ─── 04 · Fine-tuned RoBERTa ─────────────────────────────────────────────────

/** Step 1 — 160GB pretraining corpus: 10× more data than BERT. */
export function RobertaPantry() {
  const tick = useLoopTick(5000);
  const bars = [
    { label: "BERT", gb: 16, h: 0.16, hot: false },
    { label: "RoBERTa", gb: 160, h: 1, hot: true },
  ];
  return (
    <Stage>
      <div className="flex w-full max-w-xs items-end justify-center gap-10">
        {bars.map((b, i) => (
          <div key={b.label} className="flex h-36 flex-col items-center justify-end gap-2">
            <span className={cn("text-xs", b.hot ? "text-white" : "text-white/45")}>
              <Counter to={b.gb} decimals={0} suffix=" GB" delay={0.2 + i * 0.2} />
            </span>
            <div key={tick} className="flex h-28 w-12 items-end">
              <motion.div
                className={cn(
                  "w-full rounded-t-md",
                  b.hot ? "bg-white shadow-[0_0_14px_rgba(255,255,255,0.35)]" : "bg-white/20",
                )}
                initial={{ height: "0%" }}
                animate={{ height: `${b.h * 100}%` }}
                transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.2 }}
              />
            </div>
            <span className={cn("text-[11px]", b.hot ? "text-white/80" : "text-white/40")}>{b.label}</span>
          </div>
        ))}
        <motion.span
          className="font-serif text-3xl italic text-white"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 1 }}
        >
          10×
        </motion.span>
      </div>
    </Stage>
  );
}

const MASK_TOKENS = ["you", "are", "not", "welcome", "here"];
// rotating mask patterns — two positions masked per "epoch".
const MASK_SETS = [
  [0, 3],
  [2, 4],
  [1, 3],
  [0, 4],
];

/** Step 2 — Dynamic masking: the masked positions change every epoch. */
export function RobertaMasking() {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setEpoch((e) => e + 1), 1500);
    return () => clearInterval(id);
  }, []);
  const masked = MASK_SETS[epoch % MASK_SETS.length];
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {MASK_TOKENS.map((t, i) => {
            const isMasked = masked.includes(i);
            return (
              <span key={t} className="relative inline-flex">
                <AnimatePresence mode="wait">
                  {isMasked ? (
                    <motion.span
                      key="mask"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <Chip tone="solid">[MASK]</Chip>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="word"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <Chip>{t}</Chip>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Caption>epoch</Caption>
          <span className="font-serif text-lg italic tabular-nums text-white/80">
            {String(epoch + 1).padStart(2, "0")}
          </span>
          <span className="text-white/20">·</span>
          <Caption>masks never repeat</Caption>
        </div>
      </div>
    </Stage>
  );
}

/** Step 3 — No NSP: drop sentence-pair task + token_type_ids → clean sequence. */
export function RobertaNoNsp() {
  const tick = useLoopTick(5400);
  return (
    <Stage>
      <div key={tick} className="flex w-full max-w-md flex-col items-center gap-4">
        {/* BERT: sentence pair + segment ids, being strained out */}
        <div className="flex flex-col items-center gap-1.5">
          <Caption>BERT</Caption>
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0.15], y: [0, 0, 10] }}
            transition={{ duration: 2.4, times: [0, 0.5, 1], ease: EASE, repeat: Infinity, repeatDelay: 0.6 }}
          >
            <Chip tone="dim">Sent A</Chip>
            <Chip tone="dim">[SEP]</Chip>
            <Chip tone="dim">Sent B</Chip>
            <Chip tone="dim" className="line-through">NSP</Chip>
            <Chip tone="dim" className="line-through">type_ids</Chip>
          </motion.div>
        </div>

        {/* strainer sweep */}
        <div className="relative h-5 w-40">
          <motion.div
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/30"
            style={{ maskImage: "repeating-linear-gradient(90deg,#000 0 4px,transparent 4px 8px)" }}
          />
          <motion.span
            className="absolute top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest text-white/40"
            style={{ left: "50%", transform: "translate(-50%,-50%)" }}
          >
            strain
          </motion.span>
        </div>

        {/* RoBERTa: single clean sequence */}
        <div className="flex flex-col items-center gap-1.5">
          <Caption>RoBERTa</Caption>
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
          >
            <Chip tone="hot">pure sequence</Chip>
            <Chip>classification</Chip>
          </motion.div>
        </div>
      </div>
    </Stage>
  );
}

const ROC = [
  { label: "TF-IDF", v: 0.9449 },
  { label: "LSTM", v: 0.9538 },
  { label: "DistilBERT", v: 0.9796 },
  { label: "RoBERTa", v: 0.9848 },
];
// map ROC-AUC ~[0.94, 0.99] onto the chart's plot area (y: 20..86 in a 0..100 box)
const plotY = (v: number) => 86 - ((v - 0.938) / (0.99 - 0.938)) * 66;
const points = ROC.map((d, i) => ({ x: 14 + i * (172 / 3), y: plotY(d.v), ...d }));
const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

/** Step 4 — Heavy simmer to SOTA: ROC-AUC climbs the ladder to 0.9848. */
export function RobertaSimmer() {
  const tick = useLoopTick(6000);
  const peak = points[points.length - 1];
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <svg key={tick} viewBox="0 0 200 100" className="w-full" role="img" aria-label="ROC-AUC climbing to SOTA">
          {/* climbing line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          />
          {points.map((p, i) => {
            const isPeak = i === points.length - 1;
            return (
              <g key={p.label}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={isPeak ? 3.4 : 2}
                  className={isPeak ? "fill-white" : "fill-white/50"}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.3 + i * 0.35 }}
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                />
                {isPeak && (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={3.4}
                    fill="none"
                    stroke="white"
                    strokeWidth={1}
                    animate={{ r: [3.4, 9], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, ease: "easeOut", repeat: Infinity, delay: 1.6 }}
                  />
                )}
                <text
                  x={p.x}
                  y={96}
                  textAnchor="middle"
                  className={isPeak ? "fill-white/70" : "fill-white/30"}
                  style={{ fontSize: 6 }}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
          {/* twinkling SOTA star */}
          <motion.text
            x={peak.x + 6}
            y={peak.y - 4}
            className="fill-white font-serif"
            style={{ fontSize: 11, fontStyle: "italic" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            ★
          </motion.text>
        </svg>

        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic text-white sm:text-3xl">
            <Counter to={0.9848} decimals={4} duration={1.6} />
          </span>
          <Caption>mean ROC-AUC · SOTA</Caption>
        </div>
      </div>
    </Stage>
  );
}
