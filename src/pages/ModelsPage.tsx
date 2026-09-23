import { ArrowRight } from "lucide-react";
import { WordsPullUp } from "../components/WordsPullUp";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { FloatingAlphabets } from "../components/FloatingAlphabets";
import { EnlightenModal } from "../components/EnlightenModal";
import { modelPipelines } from "../utils/pipelines";
import { StepMedia } from "../components/StepMedia";
import { Term } from "../components/Term";
import { useDepth } from "../lib/depth";
import { MODELS, type ModelInfo } from "../utils/models";


const stats = (m: ModelInfo) =>
  [
    ["roc-auc", m.rocAuc.toFixed(4)],
    ["f1", m.f1.toFixed(4)],
    ["threat-f1", m.threatF1.toFixed(4)],
    ["latency", m.latency],
  ] as const;

export function ModelsPage() {
  const { t } = useDepth();
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const active = MODELS.find((x) => x.id === activeModelId);

  return (
    <div className="relative min-h-screen bg-black">
      <FloatingAlphabets />
      <div className="relative z-10 px-6 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto mb-20 text-center md:text-left">
        <div className="text-white/55 text-xs tracking-widest uppercase mb-4">Under the hood</div>
        <h1>
          <WordsPullUp
            text="The models."
            className="text-5xl md:text-7xl font-normal text-white tracking-tight mb-4"
          />
        </h1>
        <p className="text-white/65 text-lg">
          {t(
            "Each one is smarter (and slower) than the last. Tap a model to walk through how it works, step by step.",
            "Ordered by representational power: sparse lexical → recurrent → self-attention. Tap a pipeline to step through preprocessing, architecture and training choices.",
          )}
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {MODELS.map((model) => (
          <motion.div
            key={model.id}
            id={`model-${model.id}`}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-12 scroll-mt-28"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-white/50 text-xs mb-4 tabular-nums">{model.id}</div>
                <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">{model.name}</h2>

                <div className="mb-6">
                  <span className="border border-white/15 text-white/65 text-[10px] rounded-full px-3 py-1 uppercase tracking-wider">
                    {model.type}
                  </span>
                </div>

                <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8">
                  {t(model.simple, model.tech)}
                </p>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-8">
                  {stats(model).map(([term, value]) => (
                    <div key={term} className="flex flex-col-reverse">
                      <dt className="text-white/60 text-xs"><Term id={term} /></dt>
                      <dd className="text-white font-medium text-xl tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  onClick={() => setActiveModelId(model.id)}
                  className="group flex items-center space-x-2 text-white/80 hover:text-white cursor-pointer transition-colors text-sm font-medium"
                >
                  <span>Enlighten Me</span>
                  <ArrowRight aria-hidden className="w-4 h-4 transform -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

              <button
                onClick={() => setActiveModelId(model.id)}
                aria-label={`Walk through the ${model.name} pipeline`}
                className="group relative block w-full rounded-xl overflow-hidden border border-white/5 hover:border-white/15 aspect-video bg-black transition-colors cursor-pointer text-left"
              >
                <StepMedia media={modelPipelines[model.id].steps[0].media} />
                <span className="absolute bottom-3 left-3 z-20 text-[10px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                  Step 1 of {modelPipelines[model.id].steps.length} · click to explore
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    <AnimatePresence>
      {active && (
        <EnlightenModal
          model={active}
          steps={modelPipelines[active.id]?.steps ?? []}
          onClose={() => setActiveModelId(null)}
        />
      )}
    </AnimatePresence>
  </div>
  );
}
