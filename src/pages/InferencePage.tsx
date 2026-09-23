import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { WordsPullUp } from "../components/WordsPullUp";
import { ReactiveToxicityField, type FieldState } from "../components/ReactiveToxicityField";
import { cn } from "../lib/utils";
import { useDepth } from "../lib/depth";
import { runInference } from "../utils/mockInference";
import { LABEL_INFO, LABELS, MODELS, peak, pretty, type Scores } from "../utils/models";

const EASE = [0.16, 1, 0.3, 1] as const;
const COMPARE = "Compare all";
const BEST = ["DistilBERT", "RoBERTa"];
const rise = (delay: number) => ({
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { delay, duration: 0.8, ease: EASE },
});

// One-click demos, each chosen to expose a known model behavior.
const EXAMPLES = [
  { label: "Negation trap", text: "This is not bad at all, and you're definitely not an idiot." },
  { label: "Direct threat", text: "I know where you live and I am going to hurt you." },
  { label: "Sarcasm", text: "Wow, what a genius idea. Truly the smartest person alive." },
  { label: "Friendly", text: "Thanks for the thoughtful edit, this reads much better now!" },
];

type Row = { name: string; scores?: Scores; error?: string };

function ScoreBars({ scores }: { scores: Scores }) {
  const { t } = useDepth();
  return (
    <ul className="space-y-5">
      {LABELS.map((label) => {
        const score = scores[label] ?? 0;
        const hot = score > 0.5;
        return (
          <li key={label}>
            <div className="flex justify-between items-baseline gap-4 mb-2">
              <span>
                <span className="capitalize text-white/90 text-sm">{pretty(label)}</span>
                <span className="block sm:inline sm:ml-3 text-xs text-white/55">{t(LABEL_INFO[label].simple, LABEL_INFO[label].tech)}</span>
              </span>
              <span className={cn("tabular-nums text-sm", hot ? "text-white font-medium" : "text-white/65")}>
                {t(`${(score * 100).toFixed(1)}%`, `σ = ${score.toFixed(3)}`)}
              </span>
            </div>
            <div
              role="meter"
              aria-label={pretty(label)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(score * 100)}
              className="relative h-1.5 w-full bg-white/10 rounded-full"
            >
              <span aria-hidden className="absolute left-1/2 -top-1 -bottom-1 w-px bg-white/35" />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className={cn("h-full rounded-full", hot ? "bg-red-400" : "bg-white")}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Verdict({ scores, className }: { scores: Scores; className?: string }) {
  const [label, score] = peak(scores);
  const toxic = score > 0.5;
  return (
    <div
      className={cn(
        "py-1.5 px-4 rounded-md w-fit font-bold border uppercase tracking-wider",
        toxic ? "bg-[#220d0d] text-red-300 border-red-500/30" : "bg-[#0b1d12] text-green-300 border-green-500/30",
        className,
      )}
    >
      {toxic ? "✕ Toxic" : "✓ Clean"} · {pretty(label)} {Math.round(score * 100)}%
    </div>
  );
}

// Rule-based notes that tie a disagreement back to each architecture's known behaviour.
function insights(rows: Row[], t: <T>(a: T, b: T) => T): string[] {
  const s = Object.fromEntries(rows.filter((r) => r.scores).map((r) => [r.name, r.scores!]));
  const p = (m: string) => (s[m] ? peak(s[m])[1] : NaN);
  const out: string[] = [];
  const tf = p("TF-IDF + LogReg"), rb = p("RoBERTa");
  if (tf > 0.5 && rb <= 0.5)
    out.push(t(
      "TF-IDF flagged it but RoBERTa didn't. TF-IDF only counts words, so it spots a \"bad\" word but can't tell it was negated or used kindly.",
      "Bag-of-words false positive: TF-IDF fires on lexical features irrespective of order, so negation/context that RoBERTa's attention resolves is invisible to it.",
    ));
  if (tf <= 0.5 && rb > 0.5)
    out.push(t(
      "RoBERTa caught something TF-IDF missed. The toxicity is in the meaning (like sarcasm), not in obvious bad words.",
      "Lexically benign but contextually toxic: no high-weight n-grams for the linear model, while the contextual encoder picks it up.",
    ));
  const lstmThreat = s["LSTM"]?.threat ?? NaN;
  const bestThreat = Math.max(s["RoBERTa"]?.threat ?? 0, s["DistilBERT"]?.threat ?? 0);
  if (bestThreat > 0.5 && lstmThreat < 0.1)
    out.push(t(
      "The transformers see a threat but the LSTM says 0%. Threats were so rare in training (3 in 1,000) that the LSTM never learned them.",
      "LSTM threat ≈ 0 while transformers exceed 0.5: its single global class weight couldn't offset a 0.29% positive rate; per-label pos_weight in the transformers does.",
    ));
  if (!out.length && rows.every((r) => r.scores))
    out.push(t("All four models broadly agree on this one, so it's an easy case.", "No architecture-specific failure mode triggered; the models agree on the verdict."));
  return out;
}

function Heatmap({ rows }: { rows: Row[] }) {
  const { t } = useDepth();
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">Score for each label (columns) by each model (rows), as a percentage.</caption>
        <thead>
          <tr>
            <th scope="col" className="text-left font-normal text-white/55 text-xs pb-2">Model</th>
            {LABELS.map((l) => (
              <th key={l} scope="col" className="font-normal text-white/55 text-xs capitalize pb-2">{pretty(l)}</th>
            ))}
            <th scope="col" className="font-normal text-white/55 text-xs pb-2">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={r.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: EASE, duration: 0.6 }}>
              <th scope="row" className="text-left font-medium text-white pr-4 whitespace-nowrap">{r.name}</th>
              {r.scores ? (
                <>
                  {LABELS.map((l) => {
                    const v = r.scores![l] ?? 0;
                    return (
                      <td
                        key={l}
                        title={`${r.name} · ${pretty(l)}: ${(v * 100).toFixed(1)}%`}
                        className={cn("rounded-md text-center tabular-nums py-3", v > 0.5 ? "text-white font-semibold" : "text-white/75")}
                        style={{ background: `rgba(248,113,113,${0.06 + v * 0.7})` }}
                      >
                        {t(String(Math.round(v * 100)), v.toFixed(2))}
                      </td>
                    );
                  })}
                  <td className="text-center text-xs uppercase tracking-wider">
                    {peak(r.scores)[1] > 0.5 ? <span className="text-red-300">✕ toxic</span> : <span className="text-green-300">✓ clean</span>}
                  </td>
                </>
              ) : (
                <td colSpan={7} className="text-red-300/90 text-xs">{r.error}</td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InferencePage() {
  const { t } = useDepth();
  const [params] = useSearchParams();
  const initial = params.get("model");
  const [selectedModel, setSelectedModel] = useState(MODELS.some((m) => m.key === initial) ? initial! : "DistilBERT");
  const [text, setText] = useState("");
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState<Scores | null>(null);
  const [comparison, setComparison] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [analyzedWith, setAnalyzedWith] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim() || isInferencing) return;
    setIsInferencing(true);
    setResult(null);
    setComparison(null);
    setError("");
    try {
      if (selectedModel === COMPARE) {
        const settled = await Promise.allSettled(MODELS.map((m) => runInference(text, m.key)));
        const rows: Row[] = settled.map((r, i) =>
          r.status === "fulfilled"
            ? { name: MODELS[i].key, scores: r.value as Scores }
            : { name: MODELS[i].key, error: (r.reason as Error)?.message || "Failed" },
        );
        if (rows.every((r) => r.error)) throw new Error(rows[0].error);
        setComparison(rows);
      } else {
        setResult(await runInference(text, selectedModel));
        setAnalyzedWith(selectedModel);
      }
    } catch (e) {
      setError((e as Error)?.message || "Something went wrong. Try again.");
    } finally {
      setIsInferencing(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setComparison(null);
    setError("");
  };

  const compared = comparison?.filter((c) => c.scores) ?? [];
  const flagged = compared.filter((c) => peak(c.scores!)[1] > 0.5).length;
  const majorityToxic = flagged > compared.length / 2;
  // Compare mode drives the background with the models' mean peak score.
  const toxicScore = result
    ? peak(result)[1]
    : compared.length
      ? compared.reduce((sum, c) => sum + peak(c.scores!)[1], 0) / compared.length
      : 0;
  const hasOutput = !!(result || comparison);

  const fieldState: FieldState = isInferencing ? "analyzing" : hasOutput ? (toxicScore > 0.5 ? "toxic" : "clean") : "idle";

  const pill = (active: boolean) =>
    cn(
      "flex items-center px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer",
      active ? "bg-white text-black" : "border border-white/15 text-white/70 hover:text-white hover:border-white/40",
    );
  const badge = (active: boolean) =>
    cn("ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider", active ? "bg-black/10 text-black/70" : "bg-white/10 text-white/70");

  return (
    <div className="relative min-h-screen px-5 md:px-6 py-28 sm:py-32 flex flex-col items-center">
      <ReactiveToxicityField state={fieldState} score={toxicScore} />
      <div className="relative z-10 w-full max-w-4xl">
        <header className="mb-14">
          <motion.div {...rise(0.05)} className="text-white/55 text-xs tracking-widest uppercase mb-4">
            Toxicity classifier
          </motion.div>
          <h1>
            <WordsPullUp text="Say something" className="text-4xl md:text-6xl font-normal text-white tracking-tight mb-4 leading-snug" />
          </h1>
          <motion.p {...rise(0.2)} className="text-white/70 text-sm md:text-base leading-relaxed max-w-3xl">
            {t(
              "Write any comment, pick a model, and see how toxic it thinks your comment is across six categories. Try \"Compare all\" to watch four very different models argue.",
              "Six-label multi-label classification (Jigsaw taxonomy). Each model returns independent per-label probabilities; the verdict is the max over labels at a 0.5 threshold. Compare mode runs all four in parallel.",
            )}
          </motion.p>
        </header>

        <motion.div {...rise(0.3)} role="group" aria-label="Choose a model" className="flex flex-wrap gap-2.5 mb-6">
          {MODELS.map((m) => (
            <button key={m.key} type="button" aria-pressed={selectedModel === m.key} onClick={() => setSelectedModel(m.key)} className={pill(selectedModel === m.key)}>
              {m.key}
              {BEST.includes(m.key) && <span className={badge(selectedModel === m.key)}>Best</span>}
            </button>
          ))}
          <button type="button" aria-pressed={selectedModel === COMPARE} onClick={() => setSelectedModel(COMPARE)} className={cn(pill(selectedModel === COMPARE), selectedModel !== COMPARE && "border-dashed")}>
            {COMPARE}
            <span className={badge(selectedModel === COMPARE)}>×4</span>
          </button>
        </motion.div>

        <motion.div {...rise(0.4)} className="relative mb-4">
          <label htmlFor="comment" className="sr-only">Comment to analyze</label>
          <textarea
            id="comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            maxLength={2000}
            disabled={isInferencing}
            aria-describedby="comment-count"
            placeholder="Type a comment to check how toxic it is…"
            className="w-full bg-[#0A0A0A]/90 backdrop-blur-sm border border-white/15 rounded-2xl text-white placeholder:text-white/45 p-6 pb-10 text-base leading-relaxed resize-none min-h-[170px] focus:border-white/40 focus:outline-none disabled:opacity-50 transition-colors"
          />
          <div id="comment-count" className="absolute bottom-4 right-6 text-xs text-white/50 tabular-nums">
            {text.length} / 2000
          </div>
        </motion.div>

        <motion.div {...rise(0.45)} className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-white/55 text-[11px] uppercase tracking-widest mr-1">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setText(ex.text)}
              disabled={isInferencing}
              className="px-3 py-1.5 rounded-full border border-white/15 text-white/70 text-xs hover:text-white hover:border-white/40 hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </motion.div>

        <motion.div {...rise(0.5)} className="flex items-center gap-4 mb-14">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isInferencing || !text.trim()}
            className="bg-white text-black rounded-full px-8 py-3 font-medium hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center justify-center min-w-[140px] cursor-pointer disabled:cursor-not-allowed"
          >
            {isInferencing ? (
              <span className="flex space-x-1" role="status" aria-label="Analyzing">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            ) : (
              "Analyze"
            )}
          </button>
          {(hasOutput || error) && (
            <button type="button" onClick={handleClear} className="px-6 py-3 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm cursor-pointer">
              Try another
            </button>
          )}
          <kbd className="hidden sm:inline text-white/45 text-xs ml-auto font-sans">⌘/Ctrl + Enter</kbd>
        </motion.div>

        <div aria-live="polite">
          {error && (
            <div role="alert" className="mb-12 border border-red-500/30 bg-red-500/10 text-red-200 text-sm rounded-xl px-5 py-4">
              Couldn't reach the model: {error}
            </div>
          )}

          {result && (
            <motion.section
              aria-label="Result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="border-t border-white/10 pt-12"
            >
              <div className="flex flex-wrap gap-4 items-end justify-between mb-10">
                <Verdict scores={result} className="text-sm md:text-base" />
                <div className="text-white/55 text-xs uppercase tracking-wider">Analyzed with {analyzedWith}</div>
              </div>
              <ScoreBars scores={result} />
              <p className="mt-8 text-xs text-white/55 leading-relaxed">
                {t(
                  "The thin line on each bar marks 50%. Past it, the model says yes to that label. A comment can hit several labels at once.",
                  "Per-label sigmoid outputs, not a softmax: they needn't sum to 1. Tick = 0.5 decision threshold.",
                )}
              </p>
            </motion.section>
          )}

          {comparison && (
            <motion.section
              aria-label="Comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="border-t border-white/10 pt-12"
            >
              <div className="mb-8">
                <div className="text-white/55 text-xs tracking-widest uppercase mb-3">Head to head</div>
                <p className="text-2xl md:text-3xl text-white font-normal tracking-tight">
                  {majorityToxic ? flagged : compared.length - flagged} of {compared.length} models call this{" "}
                  <span className="font-serif italic text-white/70">{majorityToxic ? "toxic" : "clean"}</span>
                  {flagged > 0 && flagged < compared.length && <span className="text-white/50">. They disagree.</span>}
                </p>
              </div>

              <Heatmap rows={comparison} />

              <ul className="mt-8 space-y-3">
                {insights(comparison, t).map((s) => (
                  <li key={s} className="flex gap-3 text-sm text-white/80 leading-relaxed bg-white/[0.03] border border-white/10 rounded-xl p-4">
                    <span aria-hidden className="font-serif italic text-white/50 text-lg leading-none">*</span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
