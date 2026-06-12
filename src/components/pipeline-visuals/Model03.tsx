import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Caption, Chip, Counter, EASE, rise, Stage, stage, useLoopTick } from "./primitives";

// ─── 03 · Fine-tuned DistilBERT ──────────────────────────────────────────────

const PIECES = [
  { word: "tokenization", parts: ["token", "##ization"] },
  { word: "unhappiness", parts: ["un", "##happi", "##ness"] },
];

/** Step 1 — WordPiece: words split into subwords (## marks continuations). */
export function BertWordpiece() {
  const tick = useLoopTick(5000);
  return (
    <Stage>
      <div key={tick} className="flex w-full max-w-md flex-col items-center gap-5">
        {PIECES.map((row, ri) => (
          <div key={row.word} className="flex w-full items-center justify-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: ri * 0.25 }}
            >
              <Chip>{row.word}</Chip>
            </motion.div>
            <motion.span
              className="text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + ri * 0.25 }}
            >
              →
            </motion.span>
            <div className="flex gap-1.5">
              {row.parts.map((p, pi) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.5 + ri * 0.25 + pi * 0.12 }}
                >
                  <Chip tone={p.startsWith("##") ? "dim" : "hot"}>{p}</Chip>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        <Caption>stopwords kept · structure preserved</Caption>
      </div>
    </Stage>
  );
}

const ATT_TOKENS = [
  { t: "You", x: 46, hot: true },
  { t: "are", x: 96, hot: false },
  { t: "such", x: 142, hot: false },
  { t: "an", x: 180, hot: false },
  { t: "idiot", x: 224, hot: true },
];
// from-x, to-x, apex-y, opacity — multiple "heads" at varied strengths.
const ARCS = [
  { x1: 224, x2: 46, ay: 26, o: 0.85, w: 1.6 },
  { x1: 142, x2: 224, ay: 64, o: 0.45, w: 1 },
  { x1: 96, x2: 46, ay: 92, o: 0.3, w: 1 },
  { x1: 180, x2: 224, ay: 96, o: 0.28, w: 1 },
];

/** Step 2 — Self-attention: heads link distant words (idiot ↔ You). */
export function BertAttention() {
  const tick = useLoopTick(5200);
  return (
    <Stage>
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <svg key={tick} viewBox="0 0 270 150" className="w-full" role="img" aria-label="self-attention links">
          {ARCS.map((a, i) => (
            <motion.path
              key={i}
              d={`M ${a.x1} 122 Q ${(a.x1 + a.x2) / 2} ${a.ay} ${a.x2} 122`}
              fill="none"
              stroke="white"
              strokeWidth={a.w}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: a.o }}
              transition={{ duration: 1, ease: EASE, delay: 0.2 + i * 0.18 }}
            />
          ))}
          {/* pulse riding the strongest link */}
          <motion.circle
            r="2.6"
            fill="white"
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4, delay: 1.2 }}
            style={{ offsetPath: `path("M 224 122 Q 135 26 46 122")`, offsetRotate: "0deg" }}
          />
          {ATT_TOKENS.map((tok) => (
            <text
              key={tok.t}
              x={tok.x}
              y={138}
              textAnchor="middle"
              className={cn("font-sans text-[11px]", tok.hot ? "fill-white" : "fill-white/45")}
              style={{ fontSize: 11 }}
            >
              {tok.t}
            </text>
          ))}
        </svg>
        <Caption>12 heads · context, negation, sarcasm</Caption>
      </div>
    </Stage>
  );
}

/** Step 3 — Differential learning rates: head sears hot, backbone simmers low. */
export function BertHeat() {
  return (
    <Stage>
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <HeatBlock label="classification head" lr="2e-4" intense />
        <HeatBlock label="DistilBERT backbone" lr="2e-5" intense={false} />
      </div>
    </Stage>
  );
}

function HeatBlock({ label, lr, intense }: { label: string; lr: string; intense: boolean }) {
  const particles = intense ? 7 : 4;
  return (
    <div className="relative">
      {/* rising heat particles */}
      <div className="pointer-events-none absolute inset-x-0 -top-5 h-5 overflow-hidden">
        {Array.from({ length: particles }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 h-1 w-1 rounded-full bg-white"
            style={{ left: `${10 + i * (80 / particles)}%` }}
            animate={{
              y: [0, -20],
              opacity: intense ? [0, 0.9, 0] : [0, 0.4, 0],
            }}
            transition={{
              duration: intense ? 1.1 : 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * (intense ? 0.14 : 0.4),
            }}
          />
        ))}
      </div>

      <motion.div
        className="flex items-center justify-between rounded-lg border px-4 py-3"
        animate={{
          borderColor: intense
            ? ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]
            : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0.1)"],
          backgroundColor: intense
            ? ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]
            : ["rgba(255,255,255,0.01)", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.01)"],
        }}
        transition={{ duration: intense ? 1.1 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className={cn("text-sm", intense ? "text-white" : "text-white/55")}>{label}</span>
        <span className={cn("font-serif text-lg italic", intense ? "text-white" : "text-white/50")}>{lr}</span>
      </motion.div>
    </div>
  );
}

/** Step 4 — Weighted loss: rare-class errors penalised ×368, F1 0.00 → 0.18. */
export function BertWeightedLoss() {
  const tick = useLoopTick(5200);
  return (
    <Stage>
      <div key={tick} className="flex w-full max-w-md flex-col items-center gap-5">
        {/* penalty amplifier */}
        <motion.div
          variants={stage}
          initial="hidden"
          animate="show"
          className="flex items-center gap-3"
        >
          <motion.div variants={rise} className="flex flex-col items-center gap-1">
            <Chip tone="dim">threat miss</Chip>
            <Caption>error</Caption>
          </motion.div>
          <motion.span variants={rise} className="text-white/30">×</motion.span>
          <motion.div variants={rise} className="flex flex-col items-center gap-1">
            <span className="font-serif text-3xl italic text-white sm:text-4xl">368</span>
            <Caption>weight</Caption>
          </motion.div>
          <motion.span variants={rise} className="text-white/30">→</motion.span>
          <motion.div variants={rise}>
            <Chip tone="hot" className="px-3 py-2 text-sm">heavy penalty</Chip>
          </motion.div>
        </motion.div>

        {/* F1 recovery */}
        <div className="flex w-full max-w-[280px] flex-col gap-2 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <Caption>threat F1</Caption>
            <span className="text-sm text-white/80">
              <span className="text-white/40">0.00</span>
              <span className="mx-1.5 text-white/30">→</span>
              <Counter to={0.18} delay={0.6} />
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "18%" }}
              transition={{ duration: 1, ease: EASE, delay: 0.6 }}
            />
          </div>
        </div>
      </div>
    </Stage>
  );
}
