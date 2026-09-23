import { useId, type ReactNode } from "react";
import { useDepth } from "../lib/depth";

// Jargon a student may not know, explained at the reader's chosen depth.
const GLOSSARY: Record<string, { title: string; simple: string; tech: string }> = {
  "roc-auc": {
    title: "ROC-AUC",
    simple:
      "Pick one toxic and one clean comment at random. How often does the model give the toxic one the higher score? 1.0 = always, 0.5 = coin flip.",
    tech:
      "Area under the ROC curve (TPR vs FPR over all thresholds), averaged column-wise over the six labels. Threshold-free and insensitive to class prior, which is why it can look excellent while F1 stays modest.",
  },
  f1: {
    title: "F1 score",
    simple:
      "Balances two questions: of the comments it flagged, how many were really toxic? And of all the toxic comments, how many did it catch? 1.0 is perfect.",
    tech:
      "Harmonic mean of precision and recall at a 0.5 threshold, macro-averaged over the six labels. Rare labels weigh as much as common ones, so minority-class failures drag it down hard.",
  },
  "threat-f1": {
    title: "Threat F1",
    simple: "The F1 score on threats only, the rarest label (about 3 in 1,000 comments). The hardest test of all.",
    tech: "Per-label F1 on `threat` (46 positives in 16k, 0.29%). The best single probe of how a model handles extreme class imbalance.",
  },
  latency: {
    title: "Latency",
    simple: "How long the model takes to judge one comment.",
    tech: "Approximate per-comment inference time measured in our notebooks; grows with parameter count and sequence length.",
  },
};

export function Term({ id, children }: { id: keyof typeof GLOSSARY; children?: ReactNode }) {
  const { t } = useDepth();
  const pop = useId();
  const g = GLOSSARY[id];
  return (
    <>
      <button
        type="button"
        popoverTarget={pop}
        className="cursor-help underline decoration-dotted decoration-white/40 underline-offset-4 hover:decoration-white"
      >
        {children ?? g.title}
      </button>
      <div id={pop} popover="auto" role="note" className="term-pop">
        <div className="text-[11px] uppercase tracking-widest text-white/55 mb-2">{g.title}</div>
        <p className="text-sm leading-relaxed text-white/85">{t(g.simple, g.tech)}</p>
        <button type="button" popoverTarget={pop} popoverTargetAction="hide" className="mt-4 text-xs text-white/60 hover:text-white">
          Got it
        </button>
      </div>
    </>
  );
}
