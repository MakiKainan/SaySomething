import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
}

export function WordsPullUpMultiStyle({ segments, className }: WordsPullUpMultiStyleProps) {
  return (
    <div className={cn("inline-block", className)}>
      {segments.map((segment, sgIdx) => (
        <span key={sgIdx} className={cn("inline-block mr-2 last:mr-0", segment.className)}>
          {segment.text.split(" ").map((word, wIdx) => (
            <motion.span
              key={`${sgIdx}-${wIdx}`}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: (sgIdx * 0.15) + (wIdx * 0.08),
                ease: [0.16, 1, 0.3, 1],
                duration: 0.8,
              }}
              className="inline-block"
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </span>
      ))}
    </div>
  );
}
