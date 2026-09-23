import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { WordsPullUp } from "../components/WordsPullUp";
import { WordsPullUpMultiStyle } from "../components/WordsPullUpMultiStyle";
import { AnimatedLetter } from "../components/AnimatedLetter";
import { InteractiveDotField } from "../components/InteractiveDotField";
import { HowItWorks } from "../components/HowItWorks";
import { LabelWaffle } from "../components/LabelWaffle";
import { Term } from "../components/Term";
import { DepthToggle, useDepth } from "../lib/depth";
import { MODELS } from "../utils/models";

const EASE = [0.16, 1, 0.3, 1] as const;

function Section({ id, eyebrow, title, sub, children }: { id: string; eyebrow: string; title: string; sub: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="py-6 md:py-10 px-4 md:px-6 scroll-mt-24">
      <div className="max-w-6xl mx-auto bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-noise opacity-[0.04] pointer-events-none" />
        <div className="relative">
          <div className="text-white/55 text-xs tracking-[0.2em] uppercase mb-4">{eyebrow}</div>
          <h2 id={`${id}-title`} className="mb-10 md:mb-12">
            <WordsPullUpMultiStyle
              segments={[
                { text: title, className: "text-3xl md:text-5xl font-normal text-white block mb-1" },
                { text: sub, className: "text-3xl md:text-5xl font-normal text-white/45 block" },
              ]}
            />
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}

function MetricBar({ term, value }: { term: "roc-auc" | "f1" | "threat-f1"; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/65 mb-1.5">
        <Term id={term} />
        <span className="text-white tabular-nums font-medium">{value.toFixed(value ? 4 : 2)}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export function HomePage() {
  const { t } = useDepth();

  return (
    <div className="bg-black min-h-screen text-white">
      {/* HERO */}
      <section className="min-h-[640px] h-screen p-4 md:p-6 pb-0">
        <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-black flex flex-col justify-end">
          <InteractiveDotField />
          <div aria-hidden className="absolute inset-0 noise-overlay opacity-[0.15]" />

          <div aria-hidden className="absolute top-24 right-8 text-white/35 text-[10px] tracking-wider flex-col items-end z-20 pointer-events-none hidden md:flex">
            <span>16,000 COMMENTS</span>
            <span>6 LABELS</span>
            <span>4 MODELS</span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 px-5 pb-10 md:px-12 md:pb-16 items-end">
            <div className="md:col-span-7">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, ease: EASE, duration: 0.8 }}
                className="text-white/70 text-base md:text-lg max-w-md mb-4"
              >
                Type any comment. Four AI models tell you if it's toxic, what kind, and where they disagree.
              </motion.p>
              <h1>
                <WordsPullUp
                  text="SaySomething"
                  showAsterisk
                  className="text-[13.5vw] md:text-[11vw] font-medium leading-[0.85] tracking-[-0.05em] text-white"
                />
              </h1>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, ease: EASE, duration: 0.8 }}
              className="md:col-span-5 flex flex-col gap-5 md:items-end"
            >
              <div className="w-full md:max-w-sm">
                <div className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">Who's reading?</div>
                <DepthToggle size="lg" className="bg-black/60 backdrop-blur-md" />
              </div>
              <Link
                to="/inference"
                className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold flex items-center gap-3 hover:pr-8 transition-all duration-300 group w-fit"
              >
                Try the live demo
                <span className="bg-black rounded-full p-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight aria-hidden className="w-4 h-4 text-white" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-2xl md:text-4xl leading-snug tracking-tight">
          <AnimatedLetter text="The internet has a toxicity problem, and no human team can read every comment. So we taught four machines to try, from a word counter to a transformer, and built this to show how differently they think." />
        </div>
      </section>

      <Section id="how" eyebrow="01 · The idea" title="How does a computer" sub="read a comment?">
        <HowItWorks />
      </Section>

      <Section id="data" eyebrow="02 · The data" title="Most comments are fine." sub="That's the hard part.">
        <LabelWaffle />
      </Section>

      <Section id="models" eyebrow="03 · The models" title="Four ways to read." sub="From word counts to attention.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODELS.map((m, i) => (
            <motion.article
              key={m.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.1 * i, ease: EASE, duration: 0.8 }}
              className="bg-black/50 border border-white/5 rounded-2xl p-5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-5">
                <span className="text-xs text-white/50 tabular-nums">{m.id}</span>
                <span className="px-2 py-0.5 border border-white/15 text-[10px] rounded-full text-white/65 uppercase tracking-widest">{m.type}</span>
              </div>
              <h3 className="text-xl font-medium mb-3">{m.name}</h3>
              <motion.p key={t("s", "t")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/65 text-sm leading-relaxed mb-6">
                {t(m.simple, m.tech)}
              </motion.p>
              <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
                <MetricBar term="roc-auc" value={m.rocAuc} />
                <MetricBar term="f1" value={m.f1} />
                <MetricBar term="threat-f1" value={m.threatF1} />
              </div>
              <div className="mt-6 flex gap-2">
                <Link
                  to={`/inference?model=${encodeURIComponent(m.key)}`}
                  className="flex-1 text-center rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider py-2.5 hover:bg-white/85 transition-colors"
                >
                  Try it
                </Link>
                <Link
                  to={`/models#model-${m.id}`}
                  aria-label={`How ${m.name} works`}
                  className="flex-1 flex items-center justify-center gap-1 rounded-full border border-white/15 text-white text-xs font-bold uppercase tracking-wider py-2.5 hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  Inside <ArrowUpRight aria-hidden className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
        <p className="mt-8 text-sm text-white/60 max-w-3xl">
          {t(
            "Notice the threat bar: the LSTM scores exactly zero. It saw so few threats while learning that it decided never to predict one. The transformers were given a bigger penalty for missing rare labels, and it paid off.",
            "ROC-AUC barely separates the four (0.945 → 0.985) because it's threshold-free and prior-insensitive. Macro and threat F1 tell the real story: per-label pos_weight in the transformer fine-tunes is what lifts threat F1 from 0.00 (LSTM) to 0.35 (RoBERTa).",
          )}
        </p>
      </Section>

      {/* CTA */}
      <section className="px-6 py-24 md:py-32 text-center">
        <h2 className="text-5xl md:text-8xl font-medium tracking-[-0.04em] mb-8">
          Your turn. <span className="font-serif italic font-normal text-white/60">Say something.</span>
        </h2>
        <Link
          to="/inference"
          className="inline-flex items-center gap-3 bg-white text-black px-7 py-3.5 rounded-full text-sm font-bold hover:gap-5 transition-all"
        >
          Open the classifier <ArrowRight aria-hidden className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
