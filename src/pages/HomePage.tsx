import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { WordsPullUp } from "../components/WordsPullUp";
import { WordsPullUpMultiStyle } from "../components/WordsPullUpMultiStyle";
import { AnimatedLetter } from "../components/AnimatedLetter";
import { InteractiveDotField } from "../components/InteractiveDotField";
import { motion, useInView } from "motion/react";
import { useState, useRef } from "react";
import { runInference } from "../utils/mockInference";
import { cn } from "../lib/utils";

// Placeholders
const IMAGE_OR_VIDEO_CARD1 = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1470&auto=format&fit=crop";
const IMAGE_CARD3_ICON_URL = "https://images.unsplash.com/photo-1620825937374-87fc7d62828e?q=80&w=256&auto=format&fit=crop";
const IMAGE_CARD4_ICON_URL = "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=256&auto=format&fit=crop";

const members = [
  {
    name: "Fiko Alexie Van Houten",
    role: "2802520274",
    image: "https://stbm7resourcesprod.blob.core.windows.net/profilepicture/a181ac51-f03f-42f9-b7b5-53f536435c8b.jpg",
    bio: "Crafted working models and leads in debugging."
  },
  {
    name: "Richtjhie Hartawan Agusta",
    role: "2802529102",
    image: "https://stbm7resourcesprod.blob.core.windows.net/profilepicture/20961421-3353-400f-93c1-c263c931274a.jpg",
    bio: "Works on documentation and theory-heavy segments."
  },
  {
    name: "Kevin Sukias Kartanegara",
    role: "2802526416",
    image: "https://stbm7resourcesprod.blob.core.windows.net/profilepicture/358b5564-adf8-4b75-a560-038582fcf63a.jpg",
    bio: "Carving the group workflow and maintaining the group's vision on creating a worthy result"
  }
];

export function HomePage() {
  const navigate = useNavigate();
  const [inferenceText, setInferenceText] = useState("");
  const [selectedModel, setSelectedModel] = useState("DistilBERT");
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [yays, setYays] = useState<Record<string, boolean>>({});
  const [carouselIndex, setCarouselIndex] = useState(0);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % members.length);
  };
  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + members.length) % members.length);
  };

  const handleYay = (modelId: string) => {
    setYays(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  const handleRunInference = async () => {
    if (!inferenceText) return;
    setIsInferencing(true);
    const result = await runInference(inferenceText, selectedModel);
    setInferenceResult(result);
    setIsInferencing(false);
  };

  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const isCardsInView = useInView(cardsContainerRef, { once: true, margin: "-100px" });

  return (
    <div className="bg-black min-h-screen text-white">
      {/* SECTION 1 - HERO */}
      <section className="h-screen p-4 md:p-6 pb-0">
        <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-black flex flex-col justify-end">
          <InteractiveDotField />
          <div className="absolute inset-0 noise-overlay opacity-[0.15]"></div>

          {/* Corner Decor */}
          <div className="absolute bottom-8 right-8 text-white/15 text-[10px] tracking-tighter flex flex-col items-end z-20 pointer-events-none hidden md:flex">
            <span>LATENCY: 42MS</span>
            <span>MODEL: v2.0.4-DISTIL</span>
            <span>TIMESTAMP: 2024.11.23</span>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 px-6 pb-12 md:px-12 md:pb-16 items-end">
            <div className="md:col-span-8">
              <WordsPullUp 
                text="SaySomething" 
                showAsterisk 
                className="text-[12vw] font-medium leading-[0.85] tracking-[-0.05em] text-white flex items-start" 
              />
            </div>
            
            <div className="md:col-span-4 flex flex-col items-start md:items-end md:text-right">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
              >
                <Link to="/inference" className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold flex items-center gap-3 hover:pr-8 transition-all duration-300 group">
                  Try the model
                  <span className="bg-black rounded-full p-1 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - ABOUT */}
      <section id="about" className="bg-black py-8 md:py-12 px-6">
        <div className="max-w-6xl mx-auto bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="mb-8">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-2">Core Research & Engineering Team</span>
          </div>

          {/* Draggable & Clickable Carousel Profile Card */}
          <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Active Team Member Card */}
            <div className="lg:col-span-8 bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center relative overflow-hidden">
              <div className="absolute inset-0 noise-overlay opacity-[0.05] pointer-events-none"></div>
              
              {/* Profile Image with smooth motion transition */}
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-xl">
                <motion.img 
                  key={carouselIndex}
                  initial={{ opacity: 0, scale: 0.95, filter: "grayscale(100%)" }}
                  animate={{ opacity: 1, scale: 1, filter: "grayscale(0%)" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  src={members[carouselIndex].image} 
                  alt={members[carouselIndex].name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Profile Specs */}
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <motion.div
                  key={carouselIndex + "-text"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium block mb-2">{members[carouselIndex].role}</span>
                  <h3 className="text-2xl md:text-3xl font-medium text-white mb-4 tracking-tight">{members[carouselIndex].name}</h3>
                  <p className="text-white/60 text-[13px] md:text-sm font-sans leading-relaxed">
                    {members[carouselIndex].bio}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Carousel Controls & Secondary Intro */}
            <div className="lg:col-span-4 flex flex-col gap-6 justify-center">
              <div>
                <h2 className="text-xl md:text-2xl font-normal text-white leading-tight mb-2">
                  Linguistic Architects
                </h2>
                <p className="text-white/40 text-xs leading-relaxed max-w-sm">
                  Connecting research prototypes directly to low-latency client environments.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={prevSlide}
                  aria-label="Previous team member"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1.5">
                  {members.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={cn(
                        "h-1 px-2.5 rounded-full transition-all cursor-pointer",
                        idx === carouselIndex ? "bg-white w-5" : "bg-white/20 w-2 hover:bg-white/40"
                      )}
                    />
                  ))}
                </div>

                <button 
                  onClick={nextSlide}
                  aria-label="Next team member"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-w-2xl text-lg md:text-xl leading-snug">
            <AnimatedLetter 
              text="SaySomething is our NLP project designed to classify toxic comments. This was created with passion and we had fun during the whole process." 
            />
          </div>
        </div>
      </section>

      {/* SECTION 3 - FEATURES */}
      <section className="bg-black py-8 md:py-12 px-6">
        <div className="max-w-6xl mx-auto bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 md:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none"></div>
          
          <div className="relative z-10 w-full">
            <div className="mb-10 md:mb-12 text-center md:text-left">
              <WordsPullUpMultiStyle 
                segments={[
                  { text: "We naturally processed the language:D", className: "text-3xl md:text-5xl lg:text-6xl font-normal text-white block mb-2" },
                  { text: "with these 4 models.", className: "text-3xl md:text-5xl lg:text-6xl font-normal text-white/35 block" }
                ]}
              />
            </div>

            <div 
              ref={cardsContainerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Card 1 - TF-IDF + Logistic Regression */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={isCardsInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
                className="lg:h-[480px] bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] text-white/20">01</span>
                    <span className="px-2 py-0.5 border border-white/15 text-[9px] rounded-full text-white/50 uppercase tracking-widest">Classical ML</span>
                  </div>
                  <h3 className="text-xl font-medium mb-3">TF-IDF + Logistic Regression</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    Baseline model that tokenizes text into distinct n-grams and weighs frequency. Context-blind but extremely fast.
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Accuracy:</span>
                      <span className="text-white font-medium">86.4%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Latency:</span>
                      <span className="text-white font-medium">2ms</span>
                    </div>
                  </div>
                </div>

                {/* Yay/Nay Buttons */}
                <div className="mt-8 flex gap-3 items-start">
                  <button 
                    onClick={() => navigate("/inference")}
                    className="nav-pill flex-1 border border-white/10 text-white bg-transparent hover:border-white/30 hover:bg-white/5 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Yay</span>
                    <span className="nav-sub text-[10px] text-white/50 normal-case font-normal tracking-normal">lets gooo</span>
                  </button>
                  <button 
                    onClick={() => navigate("/models#model-01")}
                    className="nav-pill flex-1 bg-white text-black hover:opacity-90 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Nay</span>
                    <span className="nav-sub text-[10px] text-black/60 normal-case font-normal tracking-normal">i dont understand :|</span>
                  </button>
                </div>
              </motion.div>

              {/* Card 2 - LSTM */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={isCardsInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
                className="lg:h-[480px] bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] text-white/20">02</span>
                    <span className="px-2 py-0.5 border border-white/15 text-[9px] rounded-full text-white/50 uppercase tracking-widest">Deep Learning</span>
                  </div>
                  <h3 className="text-xl font-medium mb-3">LSTM Network</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    Processes text sequentially, holding onto cell states and gates. Captures basic syntactic context and negation.
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Accuracy:</span>
                      <span className="text-white font-medium">91.2%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Latency:</span>
                      <span className="text-white font-medium">15ms</span>
                    </div>
                  </div>
                </div>

                {/* Yay/Nay Buttons */}
                <div className="mt-8 flex gap-3 items-start">
                  <button 
                    onClick={() => navigate("/inference")}
                    className="nav-pill flex-1 border border-white/10 text-white bg-transparent hover:border-white/30 hover:bg-white/5 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Yay</span>
                    <span className="nav-sub text-[10px] text-white/50 normal-case font-normal tracking-normal">lets gooo</span>
                  </button>
                  <button 
                    onClick={() => navigate("/models#model-02")}
                    className="nav-pill flex-1 bg-white text-black hover:opacity-90 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Nay</span>
                    <span className="nav-sub text-[10px] text-black/60 normal-case font-normal tracking-normal">i dont understand :|</span>
                  </button>
                </div>
              </motion.div>

              {/* Card 3 - DistilBERT */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={isCardsInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.45, ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
                className="lg:h-[480px] bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] text-white/20">03</span>
                    <span className="px-2 py-0.5 border border-white/15 text-[9px] rounded-full text-white/50 uppercase tracking-widest">Transformer</span>
                  </div>
                  <h3 className="text-xl font-medium mb-3">DistilBERT</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    Uses bidirectional self-attention and distilled knowledge distillation to process words contextually. Retains 97% of BERT's language understanding while being 60% faster.
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Accuracy:</span>
                      <span className="text-white font-medium">94.8%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Latency:</span>
                      <span className="text-white font-medium">32ms</span>
                    </div>
                  </div>
                </div>

                {/* Yay/Nay Buttons */}
                <div className="mt-8 flex gap-3 items-start">
                  <button 
                    onClick={() => navigate("/inference")}
                    className="nav-pill flex-1 border border-white/10 text-white bg-transparent hover:border-white/30 hover:bg-white/5 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Yay</span>
                    <span className="nav-sub text-[10px] text-white/50 normal-case font-normal tracking-normal">lets gooo</span>
                  </button>
                  <button 
                    onClick={() => navigate("/models#model-03")}
                    className="nav-pill flex-1 bg-white text-black hover:opacity-90 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Nay</span>
                    <span className="nav-sub text-[10px] text-black/60 normal-case font-normal tracking-normal">i dont understand :|</span>
                  </button>
                </div>
              </motion.div>

              {/* Card 4 - RoBERTa */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={isCardsInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.6, ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
                className="lg:h-[480px] bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] text-white/20">04</span>
                    <span className="px-2 py-0.5 border border-white/15 text-[9px] rounded-full text-white/50 uppercase tracking-widest">SOTA Transformer</span>
                  </div>
                  <h3 className="text-xl font-medium mb-3">RoBERTa Pipeline</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    Robustly optimized BERT approach. Dynamic masking allows handling highly adversarial or nested toxic phrases.
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Accuracy:</span>
                      <span className="text-white font-medium">97.1%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Latency:</span>
                      <span className="text-white font-medium">65ms</span>
                    </div>
                  </div>
                </div>

                {/* Yay/Nay Buttons */}
                <div className="mt-8 flex gap-3 items-start">
                  <button 
                    onClick={() => navigate("/inference")}
                    className="nav-pill flex-1 border border-white/10 text-white bg-transparent hover:border-white/30 hover:bg-white/5 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Yay</span>
                    <span className="nav-sub text-[10px] text-white/50 normal-case font-normal tracking-normal">lets gooo</span>
                  </button>
                  <button 
                    onClick={() => navigate("/models#model-04")}
                    className="nav-pill flex-1 bg-white text-black hover:opacity-90 font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span className="nav-label text-xs">Nay</span>
                    <span className="nav-sub text-[10px] text-black/60 normal-case font-normal tracking-normal">i dont know</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
