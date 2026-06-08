import { useEffect, useRef } from "react";

export function InteractiveDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dots: any[] = [];
    let mx = -1000;
    let my = -1000;

    const SPACING = 32;
    const REST_RADIUS = 1.5;
    const REST_OPACITY = 0.12;
    const HOVER_RADIUS = 80;
    const FORCE_MULTIPLIER = 6;
    const DISPLACED_RADIUS = 2.3;
    const DISPLACED_OPACITY = 0.67;
    const FRICTION = 0.78;
    const SPRING = 0.08;

    const initDots = () => {
      dots = [];
      for (let x = 0; x < width; x += SPACING) {
        for (let y = 0; y < height; y += SPACING) {
          dots.push({
            ox: x,
            oy: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    handleResize();

    const updateMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mx = -1000;
      my = -1000;
    };

    window.addEventListener("mousemove", updateMouse);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mx - dot.x;
        const dy = my - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS) {
          const force = (HOVER_RADIUS - dist) / HOVER_RADIUS;
          const angle = Math.atan2(dy, dx);
          
          dot.vx -= Math.cos(angle) * force * FORCE_MULTIPLIER;
          dot.vy -= Math.sin(angle) * force * FORCE_MULTIPLIER;
        }

        dot.vx += (dot.ox - dot.x) * SPRING;
        dot.vy += (dot.oy - dot.y) * SPRING;

        dot.vx *= FRICTION;
        dot.vy *= FRICTION;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Visual state based on displacement
        const displacementDist = Math.sqrt((dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2);
        const intensity = Math.min(displacementDist / 10, 1); // 0 to 1

        const radius = REST_RADIUS + (DISPLACED_RADIUS - REST_RADIUS) * intensity;
        const opacity = REST_OPACITY + (DISPLACED_OPACITY - REST_OPACITY) * intensity;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
        ctx.closePath();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", updateMouse);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
