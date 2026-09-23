/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { MotionConfig, AnimatePresence, motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { InferencePage } from "./pages/InferencePage";
import { ModelsPage } from "./pages/ModelsPage";
import { DepthProvider } from "./lib/depth";

// New page → top; "#anchor" → scroll to it (works across routes too).
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(id);
  }, [pathname, hash]);
  return null;
}

// Booth mode: after a minute with no input, go home and loop the showreel.
// Any touch, key or mouse move dismisses it.
const IDLE_MS = 60_000;

function IdleVideo() {
  const [idle, setIdle] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => {
        setIdle(true);
        navigate("/");
      }, IDLE_MS);
    };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [navigate]);
  return (
    <AnimatePresence>
      {idle && (
        <motion.div
          className="fixed inset-0 z-[300] bg-black cursor-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <video className="w-full h-full object-cover" src="/idle.mp4" autoPlay muted loop playsInline />
          <div className="absolute bottom-10 inset-x-0 text-center text-white/70 text-sm tracking-widest uppercase animate-pulse">
            Touch anywhere to start
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10 text-sm text-white/60">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div className="max-w-md">
          <div className="text-white text-lg font-medium mb-2">SaySomething<span className="font-serif italic text-white/50">*</span></div>
          <p className="leading-relaxed">
            <span className="font-serif italic">*</span> Trained on the{" "}
            <a className="underline underline-offset-4 hover:text-white" href="https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge" target="_blank" rel="noreferrer">
              Jigsaw Toxic Comment
            </a>{" "}
            dataset (Wikipedia talk-page comments). Every prediction comes from the real trained model.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6">
          <Link className="hover:text-white" to="/#how">How it works</Link>
          <Link className="hover:text-white" to="/models">Models</Link>
          <Link className="hover:text-white" to="/inference">Try it</Link>
        </nav>
        <div className="text-white/45 text-xs">NLP · Computer Science Festival 2026</div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <Router>
      <MotionConfig reducedMotion="user">
        <DepthProvider>
          <div className="min-h-screen bg-black w-full overflow-x-clip text-white font-sans selection:bg-white/20">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-full">
              Skip to content
            </a>
            <ScrollManager />
            <IdleVideo />
            <Navbar />
            <main id="main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/inference" element={<InferencePage />} />
                <Route path="/models" element={<ModelsPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </DepthProvider>
      </MotionConfig>
    </Router>
  );
}
