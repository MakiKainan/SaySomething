import { motion } from "motion/react";

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}

export function WordsPullUp({ text, className, showAsterisk }: WordsPullUpProps) {
  const words = text.split(" ");
  
  return (
    <div className={`relative inline-block ${className || ""}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: i * 0.08,
            ease: [0.16, 1, 0.3, 1],
            duration: 0.8,
          }}
          className="inline-block"
        >
          {word}&nbsp;
        </motion.span>
      ))}
      {showAsterisk && (
        <motion.span
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: words.length * 0.08,
            ease: [0.16, 1, 0.3, 1],
            duration: 0.8,
          }}
          className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] text-white/40 leading-none font-normal italic font-serif"
        >
          *
        </motion.span>
      )}
    </div>
  );
}
