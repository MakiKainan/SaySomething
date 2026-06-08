import { useState } from "react";
import { WordsPullUp } from "../components/WordsPullUp";
import { cn } from "../lib/utils";
import { runInference } from "../utils/mockInference";
import { motion } from "motion/react";

export function InferencePage() {
  const [selectedModel, setSelectedModel] = useState("DistilBERT");
  const [text, setText] = useState("");
  const [isInferencing, setIsInferencing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analyzedWith, setAnalyzedWith] = useState("");

  const models = [
    { name: "TF-IDF + LogReg", badge: null },
    { name: "LSTM", badge: null },
    { name: "DistilBERT", badge: "Best" },
    { name: "RoBERTa", badge: "Best" }
  ];

  const handleAnalyze = async () => {
    if (!text) return;
    setIsInferencing(true);
    setResult(null);
    const res = await runInference(text, selectedModel);
    setAnalyzedWith(selectedModel);
    setResult(res);
    setIsInferencing(false);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-black px-6 py-24 sm:py-32 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        
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
            disabled={isInferencing}
            placeholder="Type your text here to analyze its underlying sentiment and toxicity..."
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl text-white placeholder:text-white/20 p-6 text-sm md:text-base leading-relaxed resize-none min-h-[160px] focus:border-white/25 focus:outline-none disabled:opacity-50 transition-colors"
          />
          <div className="absolute bottom-4 right-6 text-xs text-white/20">
            {text.length} chars
          </div>
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
            disabled={isInferencing || !text}
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
          
          {result && (
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Try another
            </button>
          )}
        </motion.div>

        {/* Results Panel */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/10 pt-12 mt-12"
          >
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className={cn(
                  "py-1.5 px-4 rounded-md w-fit font-bold mb-2 border text-sm md:text-base uppercase tracking-wider",
                  result.toxic > 0.5 
                    ? "bg-red-500/10 text-red-400 border-red-500/20" 
                    : "bg-green-500/10 text-green-400 border-green-500/20"
                )}>
                  {result.toxic > 0.5 ? "TOXIC" : "CLEAN"} — {Math.round(result.toxic * 100)}% CONFIDENCE
                </div>
              </div>
              <div className="text-white/30 text-xs uppercase tracking-wider">
                Analyzed using {analyzedWith}
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(result).map(([label, score]: [string, any]) => (
                <div key={label} className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80 text-sm capitalize">{label.replace("_", " ")}</span>
                    <span className="text-white/50 text-sm">{(score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
