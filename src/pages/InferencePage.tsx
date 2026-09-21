import { useState } from "react";
import { WordsPullUp } from "../components/WordsPullUp";
import { cn } from "../lib/utils";
import { runInference } from "../utils/mockInference";
import { motion } from "motion/react";
import { ReactiveToxicityField, type FieldState } from "../components/ReactiveToxicityField";

type Scores = Record<string, number>;

const LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"];
const COMPARE = "Compare all";

const models = [
  { name: "TF-IDF + LogReg", badge: null },
  { name: "LSTM", badge: null },
  { name: "DistilBERT", badge: "Best" },
  { name: "RoBERTa", badge: "Best" }
];

// One-click demos, each chosen to expose a known model behavior.
const EXAMPLES = [
  { label: "Negation trap", text: "This is not bad at all, and you're definitely not an idiot." },
  { label: "Direct threat", text: "I know where you live and I am going to hurt you." },
  { label: "Sarcasm", text: "Wow, what a genius idea. Truly the smartest person alive." },
  { label: "Friendly", text: "Thanks for the thoughtful edit, this reads much better now!" },
];

function ScoreBars({ scores, compact }: { scores: Scores; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {LABELS.map((label) => {
        const score = scores[label] ?? 0;
        return (
          <div key={label} className="w-full">
            <div className={cn("flex justify-between items-center", compact ? "mb-1" : "mb-2")}>
              <span className={cn("capitalize", compact ? "text-white/60 text-xs" : "text-white/80 text-sm")}>{label.replace(/_/g, " ")}</span>
              <span className={cn("text-white/50 tabular-nums", compact ? "text-xs" : "text-sm")}>{(score * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className={cn("h-full rounded-full", score > 0.5 ? "bg-red-400" : "bg-white")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Verdict({ toxic, className }: { toxic: number; className?: string }) {
  return (
    <div className={cn(
      "py-1.5 px-4 rounded-md w-fit font-bold border uppercase tracking-wider",
      toxic > 0.5
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-green-500/10 text-green-400 border-green-500/20",
      className
    )}>
      {toxic > 0.5 ? "TOXIC" : "CLEAN"} — {Math.round(toxic * 100)}%
    </div>
  );
}

export function InferencePage() {
  const [selectedModel, setSelectedModel] = useState("DistilBERT");
  const [text, setText] = useState("");
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState<Scores | null>(null);
  const [comparison, setComparison] = useState<{ name: string; scores?: Scores; error?: string }[] | null>(null);
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
        const settled = await Promise.allSettled(models.map((m) => runInference(text, m.name)));
        const rows = settled.map((r, i) => r.status === "fulfilled"
          ? { name: models[i].name, scores: r.value as Scores }
          : { name: models[i].name, error: (r.reason as Error)?.message || "Failed" });
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
  const flagged = compared.filter((c) => c.scores!.toxic > 0.5).length;
  // Compare mode drives the background with the models' mean toxic score.
  const toxicScore = result
    ? result.toxic
    : compared.length
    ? compared.reduce((sum, c) => sum + c.scores!.toxic, 0) / compared.length
    : 0;
  const hasOutput = !!(result || comparison);

  // Drive the reactive background from the classification lifecycle.
  const fieldState: FieldState = isInferencing
    ? "analyzing"
    : hasOutput
    ? toxicScore > 0.5
      ? "toxic"
      : "clean"
    : "idle";

  return (
    <div className="relative min-h-screen px-6 py-24 sm:py-32 flex flex-col items-center">
      <ReactiveToxicityField state={fieldState} score={toxicScore} />
      <div className="relative z-10 w-full max-w-4xl">

        {/* Header */}
        <div className="mb-16">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-white/40 text-xs tracking-widest uppercase mb-4">Toxicity Classifier</div>
          </motion.div>

          <WordsPullUp
            text="Say something"
            className="text-4xl md:text-5xl font-normal text-white tracking-tight mb-4 leading-snug block"
          />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-3xl">
              "Say something" is an applications consisted of several NLP models and trained by the popular Toxic Jigsaw Challenge dataset. Our app has a purpose to classify comments for how toxic it is and what category of toxicity fall upon.
            </p>
          </motion.div>
        </div>

        {/* Model Selector */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {models.map((m) => (
            <button
              key={m.name}
              onClick={() => setSelectedModel(m.name)}
              className={cn(
                "relative flex items-center px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200",
                selectedModel === m.name
                  ? "bg-white text-black"
                  : "border border-white/10 text-white/40 hover:text-white hover:border-white/30"
              )}
            >
              {m.name}
              {m.badge && (
                <span className={cn(
                  "ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                  selectedModel === m.name ? "bg-black/10 text-black/60" : "bg-white/10 text-white/60"
                )}>
                  {m.badge}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setSelectedModel(COMPARE)}
            className={cn(
              "flex items-center px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200",
              selectedModel === COMPARE
                ? "bg-white text-black"
                : "border border-dashed border-white/25 text-white/60 hover:text-white hover:border-white/50"
            )}
          >
            {COMPARE}
            <span className={cn(
              "ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
              selectedModel === COMPARE ? "bg-black/10 text-black/60" : "bg-white/10 text-white/60"
            )}>
              ×4
            </span>
          </button>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          <textarea
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
            placeholder="Type your text here to analyze its underlying sentiment and toxicity..."
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl text-white placeholder:text-white/20 p-6 text-sm md:text-base leading-relaxed resize-none min-h-[160px] focus:border-white/25 focus:outline-none disabled:opacity-50 transition-colors"
          />
          <div className="absolute bottom-4 right-6 text-xs text-white/20">
            {text.length} chars
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-2 -mt-4 mb-8"
        >
          <span className="text-white/30 text-[10px] uppercase tracking-widest mr-1">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setText(ex.text)}
              disabled={isInferencing}
              className="px-3 py-1 rounded-full border border-white/10 text-white/50 text-xs hover:text-white hover:border-white/30 hover:bg-white/5 disabled:opacity-50 transition-all"
            >
              {ex.label}
            </button>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center space-x-4 mb-16"
        >
          <button
            onClick={handleAnalyze}
            disabled={isInferencing || !text.trim()}
            className="bg-white text-black rounded-full px-8 py-3 font-medium hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center justify-center min-w-[140px]"
          >
            {isInferencing ? (
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : "Analyze"}
          </button>

          {(hasOutput || error) && (
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Try another
            </button>
          )}

          <span className="hidden sm:inline text-white/20 text-xs ml-auto">⌘/Ctrl + Enter</span>
        </motion.div>

        {error && (
          <div role="alert" className="mb-12 border border-red-500/20 bg-red-500/10 text-red-300 text-sm rounded-xl px-5 py-4">
            Couldn't reach the model: {error}
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/10 pt-12 mt-12"
          >
            <div className="flex flex-wrap gap-4 items-end justify-between mb-12">
              <Verdict toxic={result.toxic} className="text-sm md:text-base" />
              <div className="text-white/30 text-xs uppercase tracking-wider">
                Analyzed using {analyzedWith}
              </div>
            </div>

            <ScoreBars scores={result} />
          </motion.div>
        )}

        {comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/10 pt-12 mt-12"
          >
            <div className="mb-10">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-3">Head to head</div>
              <p className="text-2xl md:text-3xl text-white font-normal tracking-tight">
                {flagged} of {compared.length} models call this{" "}
                <span className="font-serif italic text-white/60">{flagged > compared.length / 2 ? "toxic" : "clean"}</span>
                {flagged > 0 && flagged < compared.length && <span className="text-white/35">, they disagree.</span>}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparison.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#0A0A0A]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-white text-sm font-medium">{c.name}</span>
                    <span className="text-[10px] text-white/20">0{i + 1}</span>
                  </div>
                  {c.scores ? (
                    <>
                      <Verdict toxic={c.scores.toxic} className="text-[11px] px-2.5 py-1 mb-5" />
                      <ScoreBars scores={c.scores} compact />
                    </>
                  ) : (
                    <p className="text-red-300/80 text-xs">{c.error}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
