import { useEffect, useRef } from "react";

interface Letter {
  char: string;
  size: number;
  weight: number;
  alpha: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  radius: number;
}

export function FloatingAlphabets() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lettersRef = useRef<Letter[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Helper to generate a random letter
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const generateLetter = (w: number, h: number): Letter => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const size = Math.floor(Math.random() * (64 - 18 + 1)) + 18;
      
      // Font weight: 300, 400, or 700 (weighted toward lighter)
      const weightSeed = Math.random();
      const weight = weightSeed < 0.6 ? 300 : weightSeed < 0.9 ? 400 : 700;
      
      const alpha = Math.random() * (0.14 - 0.04) + 0.04;
      
      // Velocity drift components: range 0.08 to 0.35 px/frame, random direction
      const speedX = Math.random() * (0.35 - 0.08) + 0.08;
      const vx = (Math.random() < 0.5 ? -1 : 1) * speedX;

      const speedY = Math.random() * (0.35 - 0.08) + 0.08;
      const vy = (Math.random() < 0.5 ? -1 : 1) * speedY;

      // Spin rate range 0.002 to 0.009 rad/frame, random direction
      const spinSpeed = Math.random() * (0.009 - 0.002) + 0.002;
      const spin = (Math.random() < 0.5 ? -1 : 1) * spinSpeed;

      const angle = Math.random() * Math.PI * 2;
      
      // Estimate radius based on letter size
      const radius = size * 0.5;

      // Make sure starting position is fully inside bounds
      const minX = radius;
      const maxX = Math.max(minX, w - radius);
      const minY = radius;
      const maxY = Math.max(minY, h - radius);

      const x = Math.random() * (maxX - minX) + minX;
      const y = Math.random() * (maxY - minY) + minY;

      return {
        char,
        size,
        weight,
        alpha,
        x,
        y,
        vx,
        vy,
        angle,
        spin,
        radius,
      };
    };

    // Initialize the 28 letters
    const initLetters = (w: number, h: number) => {
      const list: Letter[] = [];
      for (let i = 0; i < 28; i++) {
        list.push(generateLetter(w, h));
      }
      lettersRef.current = list;
    };

    let animationFrameId: number;

    const tick = () => {
      const w = sizeRef.current.width;
      const h = sizeRef.current.height;
      if (w === 0 || h === 0) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const letters = lettersRef.current;
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];

        // Update positions and angle
        letter.x += letter.vx;
        letter.y += letter.vy;
        letter.angle += letter.spin;

        // Collision detection and resolution
        const r = letter.radius;

        if (letter.x - r < 0) {
          letter.x = r;
          letter.vx = -letter.vx;
        } else if (letter.x + r > w) {
          letter.x = Math.max(r, w - r);
          letter.vx = -letter.vx;
        }

        if (letter.y - r < 0) {
          letter.y = r;
          letter.vy = -letter.vy;
        } else if (letter.y + r > h) {
          letter.y = Math.max(r, h - r);
          letter.vy = -letter.vy;
        }

        // Render letter
        ctx.save();
        ctx.translate(letter.x, letter.y);
        ctx.rotate(letter.angle);
        ctx.font = `${letter.weight} ${letter.size}px -apple-system, Helvetica Neue, sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${letter.alpha})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter.char, 0, 0);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    // Use ResizeObserver for precise canvas sizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        const width = rect.width;
        const height = rect.height;

        if (width === 0 || height === 0) continue;

        sizeRef.current = { width, height };

        // Set high density dimensions
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // If letters haven't been initialized, or on resize, adjust/initialize them
        if (lettersRef.current.length === 0) {
          initLetters(width, height);
        } else {
          // Clamp existing letters inside new size
          lettersRef.current.forEach((letter) => {
            const r = letter.radius;
            letter.x = Math.max(r, Math.min(width - r, letter.x));
            letter.y = Math.max(r, Math.min(height - r, letter.y));
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
      id="floating-alphabets-canvas"
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 bg-black"
      style={{ display: "block" }}
    />
  );
}
