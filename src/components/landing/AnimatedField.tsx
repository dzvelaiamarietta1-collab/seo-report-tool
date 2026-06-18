"use client";

import { useEffect, useRef } from "react";

// Dense glyph sphere — monospace characters on a parametric sphere with
// independent X+Y rotation matrices, depth-sorted by z each frame.
// Grainy density ramp + line-geometry glyphs gives a textured look.

const GLYPHS = [".", "⋅", "·", "∘", "○", "◯", "●", "+", "×", "*"];

type Pt = { x: number; y: number; z: number };

function buildLattice(): Pt[] {
  const out: Pt[] = [];
  const lats = 32;
  for (let i = 0; i < lats; i++) {
    const lat = (i / (lats - 1)) * Math.PI - Math.PI / 2;
    const cy = Math.sin(lat);
    const r = Math.cos(lat);
    const lons = Math.max(8, Math.round(60 * r));
    for (let j = 0; j < lons; j++) {
      const lon = (j / lons) * Math.PI * 2;
      out.push({ x: Math.cos(lon) * r, y: cy, z: Math.sin(lon) * r });
    }
  }
  return out;
}

export function AnimatedField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = buildLattice();
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
    const projected: Pt[] = new Array(base.length);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.5;

      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Two independent axis rotations — Y primary, X secondary.
      const ay = t * 0.32;
      const ax = t * 0.18;
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);

      for (let i = 0; i < base.length; i++) {
        const p = base[i];
        const rx = p.x * cosY + p.z * sinY;
        const rz0 = -p.x * sinY + p.z * cosY;
        const ry = p.y * cosX - rz0 * sinX;
        const rz = p.y * sinX + rz0 * cosX;
        projected[i] = { x: rx, y: ry, z: rz };
      }

      projected.sort((a, b) => a.z - b.z);

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const depth = (p.z + 1) / 2;
        const alpha = 0.15 + depth * 0.55;
        const idx = Math.min(GLYPHS.length - 1, Math.floor(depth * GLYPHS.length));
        ctx.fillStyle = `rgba(10,10,10,${alpha})`;
        ctx.fillText(GLYPHS[idx], cx + p.x * R, cy + p.y * R);
      }

      if (!reduced) t += 0.018;
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
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}
