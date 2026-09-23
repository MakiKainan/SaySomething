import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDepth } from "../lib/depth";
import { cn } from "../lib/utils";
import { LABEL_INFO, LABELS, SAMPLE, pretty, type Label } from "../utils/models";

const COLS = 40;
const GAP = 12;
const ANY = "any";
type Pick = Label | typeof ANY;

const has = (mask: number, pick: Pick) => (pick === ANY ? mask > 0 : ((mask >> LABELS.indexOf(pick)) & 1) === 1);
const count = (pick: Pick) => SAMPLE.filter((m) => has(m, pick)).length;
const labelsOf = (mask: number) => LABELS.filter((_, b) => (mask >> b) & 1).map(pretty).join(", ");

/** 1,000 real training comments, one dot each. Pick a label to light up its comments. */
export function LabelWaffle() {
  const { t } = useDepth();
  const [pick, setPick] = useState<Pick>(ANY);
  const n = count(pick);
  const info = pick === ANY ? null : LABEL_INFO[pick];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div role="group" aria-label="Highlight a label" className="flex flex-wrap gap-2">
          {([ANY, ...LABELS] as Pick[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pick === p}
              onClick={() => setPick(p)}
              onMouseEnter={() => setPick(p)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer",
                pick === p ? "bg-white text-black border-white" : "border-white/15 text-white/70 hover:text-white hover:border-white/40",
              )}
            >
              {p === ANY ? "Any label" : pretty(p)}{" "}
              <span className={cn("ml-2 tabular-nums", pick === p ? "text-black/55" : "text-white/45")}>{count(p)}</span>
            </button>
          ))}
        </div>

        <div aria-live="polite">
          <div className="flex items-baseline gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={n}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                className="text-6xl md:text-7xl font-medium tracking-tight tabular-nums"
              >
                {n}
              </motion.span>
            </AnimatePresence>
            <span className="text-white/60 text-lg">of 1,000 comments</span>
          </div>
          <p className="mt-4 text-white/75 leading-relaxed">
            {info
              ? t(info.simple, info.tech)
              : t(
                  "About 9 in 10 comments are perfectly normal. A model that always says \"clean\" would be 90% accurate and completely useless. That's why we don't judge models by accuracy.",
                  "Positive rate 10.2% for any label. Accuracy is dominated by the negative class, so we report column-wise ROC-AUC and macro F1, and counter imbalance with pos_weight = N_neg / N_pos per label.",
                )}
          </p>
          {info && (
            <p className="mt-3 text-sm text-white/55">
              {t(
                `In the full training set: ${info.count.toLocaleString()} of 16,000 comments (${info.rate}%).`,
                `Train set: ${info.count} / 16,000 positives (${info.rate}%), pos_weight ≈ ${Math.round((16000 - info.count) / info.count)}.`,
              )}
            </p>
          )}
        </div>
      </div>

      <figure className="lg:col-span-7">
        <svg
          viewBox={`0 0 ${COLS * GAP} ${(1000 / COLS) * GAP}`}
          className="w-full"
          role="img"
          aria-label={`${n} of 1,000 sampled comments are labelled ${pick === ANY ? "with any toxicity label" : pretty(pick)}.`}
        >
          {SAMPLE.map((mask, i) => {
            const on = has(mask, pick);
            return (
              <circle
                key={i}
                cx={(i % COLS) * GAP + GAP / 2}
                cy={Math.floor(i / COLS) * GAP + GAP / 2}
                r={on ? 4.5 : 3}
                className={cn("waffle-dot", on ? "fill-red-400" : mask ? "fill-white/35" : "fill-white/15")}
                style={{ transitionDelay: `${(i % COLS) * 6}ms` }}
              >
                {mask > 0 && <title>{`Comment #${i + 1}: ${labelsOf(mask)}`}</title>}
              </circle>
            );
          })}
        </svg>
        <figcaption className="mt-3 text-xs text-white/55">
          Each dot is one real comment, randomly sampled from our 16,000-comment training set. Hover a lit dot to see its labels.
        </figcaption>
      </figure>
    </div>
  );
}
