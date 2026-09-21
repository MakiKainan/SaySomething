import { ArrowRight } from "lucide-react";
import { WordsPullUp } from "../components/WordsPullUp";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { FloatingAlphabets } from "../components/FloatingAlphabets";
import { EnlightenModal } from "../components/EnlightenModal";
import { modelPipelines } from "../utils/pipelines";
import { StepMedia } from "../components/StepMedia";


export function ModelsPage() {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    }
  }, []);

  const models = [
    {
      id: "01",
      name: "TF-IDF + Logistic Regression",
      type: "Classical ML",
      description: "A solid baseline that tokenizes text into distinct n-grams and weighs their frequency across documents. Fast, explainable, but context-blind. It struggles with sarcasm and complex grammatical structures.",
      stats: [
        { label: "Mean ROC-AUC", value: "0.9449" },
        { label: "F1 Score", value: "0.4877" },
        { label: "Inference", value: "2ms" }
      ]
    },
    {
      id: "02",
      name: "LSTM (Long Short-Term Memory)",
      type: "Deep Learning",
      description: "Recurrent networks process text sequentially, holding onto a 'memory' of previous words. This allows it to capture basic syntactic context and negation, improving upon TF-IDF but still suffering from vanishing gradients on long texts.",
      stats: [
        { label: "Mean ROC-AUC", value: "0.9538" },
        { label: "F1 Score", value: "0.4097" },
        { label: "Inference", value: "15ms" }
      ]
    },
    {
      id: "03",
      name: "DistilBERT",
      type: "Transformer",
      description: "A distilled version of BERT. Uses bidirectional self-attention to process words in relation to all other words in the sentence simultaneously. Retains 97% of BERT's performance while being 60% faster.",
      stats: [
        { label: "Mean ROC-AUC", value: "0.9796" },
        { label: "F1 Score", value: "0.4896" },
        { label: "Inference", value: "35ms" }
      ]
    },
    {
      id: "04",
      name: "RoBERTa",
      type: "Transformer",
      description: "A robustly optimized BERT pretraining approach. Trained on vastly more data with dynamic masking. This stands as the state-of-the-art for our classification pipeline, capable of handling extreme adversarial inputs.",
      stats: [
        { label: "Mean ROC-AUC", value: "0.9848" },
        { label: "F1 Score", value: "0.5818" },
        { label: "Inference", value: "65ms" }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-black">
      <FloatingAlphabets />
      <div className="relative z-10 px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto mb-20 text-center md:text-left">
        <div className="text-white/40 text-xs tracking-widest uppercase mb-4">Under the hood</div>
        <WordsPullUp
          text="The models."
          className="text-5xl md:text-7xl font-normal text-white tracking-tight mb-4"
        />
        <p className="text-white/45 text-lg">Pipeline complexity increases as you scroll.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {models.map((model, idx) => (
          <motion.div
            key={model.id}
            id={`model-${model.id}`}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 md:p-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-white/20 text-xs mb-4">{model.id}</div>
                <h3 className="text-2xl md:text-3xl font-medium text-white mb-4">{model.name}</h3>

                <div className="mb-6">
                  <span className="border border-white/15 text-white/50 text-[10px] rounded-full px-3 py-1 uppercase tracking-wider">
                    {model.type}
                  </span>
                </div>

                <p className="text-white/55 text-sm md:text-base leading-relaxed mb-8">
                  {model.description}
                </p>

                <div className="flex flex-wrap gap-8 mb-8">
                  {model.stats.map(stat => (
                    <div key={stat.label}>
                      <div className="text-white font-medium text-xl md:text-2xl">{stat.value}</div>
                      <div className="text-white/35 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveModelId(model.id)}
                  className="group flex items-center space-x-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  <span>Enlighten Me</span>
                  <ArrowRight className="w-4 h-4 transform -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

              <button
                onClick={() => setActiveModelId(model.id)}
                aria-label={`Walk through the ${model.name} pipeline`}
                className="group relative block w-full rounded-xl overflow-hidden border border-white/5 hover:border-white/15 aspect-video bg-black transition-colors cursor-pointer text-left"
              >
                <StepMedia media={modelPipelines[model.id].steps[0].media} />
                <span className="absolute bottom-3 left-3 z-20 text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white/70 transition-colors">
                  Step 1 of {modelPipelines[model.id].steps.length} · click to explore
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    <AnimatePresence>
      {activeModelId && (
        <EnlightenModal
          model={(() => {
            const m = models.find((x) => x.id === activeModelId)!;
            return { id: m.id, name: m.name, type: m.type };
          })()}
          steps={modelPipelines[activeModelId]?.steps ?? []}
          onClose={() => setActiveModelId(null)}
        />
      )}
    </AnimatePresence>
  </div>
  );
}
