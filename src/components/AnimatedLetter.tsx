import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "../lib/utils";

interface AnimatedLetterProps {
  text: string;
  className?: string;
}

export function AnimatedLetter({ text, className }: AnimatedLetterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 40%"],
  });

  const words = text.split(" ");

  return (
    <div ref={containerRef} className={cn("inline-block", className)}>
      {words.map((word, wIdx) => {
        return (
          <span key={wIdx} className="inline-block mr-[0.25em]">
            {word.split("").map((char, cIdx) => {
              const start = (wIdx * 5 + cIdx) / (text.length + 5); 
              const end = start + 0.1;
              const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
              
              return (
                <motion.span key={cIdx} style={{ opacity }}>
                  {char}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}
