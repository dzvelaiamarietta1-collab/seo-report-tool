"use client";

import { useEffect, useRef } from "react";

// Dot curtain — hairline-stroked circles arranged on a tight grid,
// with a slow sinusoidal phase that rolls horizontally. Used as a
// decorative band at the top of the footer.

export function AnimatedWave() {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const gap = 22;
      const radius = 3.5;
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;

      ctx.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * gap;
          const baseY = r * gap;
          // gentle sinusoidal vertical offset; phase rolls left over time
          const phase = c * 0.32 + r * 0.18 - t * 0.6;
          const dy = Math.sin(phase) * 4;

          // alpha fades toward top + bottom edges for a soft band
          const yNorm = (baseY + dy) / Math.max(1, height);
          const edgeFade = Math.sin(Math.PI * Math.min(1, Math.max(0, yNorm)));
          const alpha = 0.05 + 0.18 * edgeFade;

          ctx.strokeStyle = `rgba(10,10,10,${alpha})`;
          ctx.beginPath();
          ctx.arc(baseX, baseY + dy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (!reduced) t += 0.012;
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="w-full h-full pointer-events-none"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}
