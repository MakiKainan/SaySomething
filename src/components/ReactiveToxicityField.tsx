import { useEffect, useRef } from "react";

/**
 * Reactive background for the Inference page. Faint comment-word fragments drift
 * in the dark and respond to the classification lifecycle:
 *   - idle      → slow, calm drift (white, low alpha)
 *   - analyzing → energized, brighter, a faint scanning shimmer
 *   - clean     → settles soft and calm
 *   - toxic     → surges red + jitters, intensity scaled by the toxic score
 *
 * Props are mirrored into a ref so prop changes never restart the animation
 * loop; per-frame values lerp toward each state's target for smooth transitions.
 */

export type FieldState = "idle" | "analyzing" | "clean" | "toxic";

interface Word {
  text: string;
  size: number;
  weight: number;
  baseAlpha: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  jitterSeed: number;
}

// Mild toxic-leaning + neutral fragments — evokes a stream of comments.
const WORDS = [
  "idiot", "stupid", "trash", "hate", "dumb", "loser", "ugly", "worst",
  "hello", "thanks", "please", "nice", "cool", "great", "you", "maybe",
  "okay", "sorry", "good", "wow", "agree", "true", "lol", "stop",
];

// Per-state animation targets the live values lerp toward.
const TARGETS: Record<
  FieldState,
  { energy: number; redness: number; jitter: number; alphaMul: number }
> = {
  idle:      { energy: 1.0, redness: 0, jitter: 0,   alphaMul: 1.0 },
  analyzing: { energy: 2.3, redness: 0, jitter: 0.6, alphaMul: 1.5 },
  clean:     { energy: 0.55, redness: 0, jitter: 0,  alphaMul: 1.25 },
  toxic:     { energy: 1.9, redness: 1, jitter: 2.4, alphaMul: 1.6 },
};

export function ReactiveToxicityField({
  state,
  score = 0,
}: {
  state: FieldState;
  score?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<Word[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  const propsRef = useRef({ state, score });

  // Mirror props into a ref so the rAF loop reads fresh values without restarting.
  useEffect(() => {
    propsRef.current = { state, score };
  }, [state, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const makeWord = (w: number, h: number): Word => {
      const text = WORDS[Math.floor(Math.random() * WORDS.length)];
      const size = Math.floor(Math.random() * (40 - 16 + 1)) + 16;
      const weightSeed = Math.random();
      const weight = weightSeed < 0.6 ? 300 : weightSeed < 0.9 ? 400 : 700;
      const baseAlpha = Math.random() * (0.12 - 0.035) + 0.035;

      const speedX = Math.random() * (0.22 - 0.05) + 0.05;
      const speedY = Math.random() * (0.22 - 0.05) + 0.05;
      const vx = (Math.random() < 0.5 ? -1 : 1) * speedX;
      const vy = (Math.random() < 0.5 ? -1 : 1) * speedY;

      const radius = size * 0.5;
      const minX = radius;
      const maxX = Math.max(minX, w - radius);
      const x = Math.random() * (maxX - minX) + minX;
      const y = Math.random() * (Math.max(radius, h - radius) - radius) + radius;

      return {
        text, size, weight, baseAlpha, x, y, vx, vy, radius,
        jitterSeed: Math.random() * 1000,
      };
    };

    const initWords = (w: number, h: number) => {
      const list: Word[] = [];
      for (let i = 0; i < 26; i++) list.push(makeWord(w, h));
      wordsRef.current = list;
    };

    // Live (smoothed) animation values.
    let energy = 1.0;
    let redness = 0;
    let jitter = 0;
    let alphaMul = 1.0;
    let frame = 0;
    let animationFrameId: number;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      const w = sizeRef.current.width;
      const h = sizeRef.current.height;
      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      frame++;

      // Ease live values toward the current state's targets.
      const { state: st, score: sc } = propsRef.current;
      const target = TARGETS[st];
      const energyTarget =
        st === "toxic" ? target.energy + sc * 1.2 : target.energy;
      const jitterTarget =
        st === "toxic" ? target.jitter + sc * 3 : target.jitter;
      energy = lerp(energy, energyTarget, 0.05);
      redness = lerp(redness, target.redness, 0.06);
      jitter = lerp(jitter, jitterTarget, 0.08);
      alphaMul = lerp(alphaMul, target.alphaMul, 0.05);

      // Scanning shimmer while analyzing.
      const shimmer = st === "analyzing" ? 0.5 + 0.5 * Math.sin(frame * 0.08) : 1;

      // Color: white → toxic red by redness.
      const r = Math.round(lerp(255, 255, redness));
      const g = Math.round(lerp(255, 60, redness));
      const b = Math.round(lerp(255, 60, redness));

      ctx.clearRect(0, 0, w, h);

      const words = wordsRef.current;
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const rad = word.radius;

        word.x += word.vx * energy;
        word.y += word.vy * energy;

        // Bounce off bounds.
        if (word.x - rad < 0) { word.x = rad; word.vx = -word.vx; }
        else if (word.x + rad > w) { word.x = Math.max(rad, w - rad); word.vx = -word.vx; }
        if (word.y - rad < 0) { word.y = rad; word.vy = -word.vy; }
        else if (word.y + rad > h) { word.y = Math.max(rad, h - rad); word.vy = -word.vy; }

        // Per-frame jitter (visual only — does not affect bounds).
        let jx = 0, jy = 0;
        if (jitter > 0.01) {
          jx = Math.sin(frame * 0.5 + word.jitterSeed) * jitter;
          jy = Math.cos(frame * 0.6 + word.jitterSeed) * jitter;
        }

        const alpha = Math.min(0.5, word.baseAlpha * alphaMul * shimmer);

        ctx.font = `${word.weight} ${word.size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(word.text, word.x + jx, word.y + jy);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        sizeRef.current = { width, height };
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (wordsRef.current.length === 0) {
          initWords(width, height);
        } else {
          wordsRef.current.forEach((word) => {
            word.x = Math.max(word.radius, Math.min(width - word.radius, word.x));
            word.y = Math.max(word.radius, Math.min(height - word.radius, word.y));
          });
        }
      }
    });

    resizeObserver.observe(canvas);
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ display: "block" }}
    />
  );
}
