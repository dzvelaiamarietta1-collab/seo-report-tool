"use client";

import { useEffect, useRef, useState } from "react";
import { Code, Gauge, Layers, ListChecks, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/locale";

const ICONS: LucideIcon[] = [Code, ListChecks, Gauge, Layers];

function TechnicalVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="20" y="20" width="160" height="120" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect
            x={30}
            y={36 + i * 18}
            width={140 - i * 8}
            height={10}
            rx="2"
            fill="currentColor"
            opacity={0.15 + i * 0.05}
          />
          <circle cx={22 + (140 - i * 8) + 14} cy={41 + i * 18} r="2" fill="currentColor" opacity={0.4} />
        </g>
      ))}
    </svg>
  );
}

function OnPageVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="14" y="22" width="100" height="14" rx="2" fill="currentColor" />
      <rect x="14" y="48" width="78" height="10" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="30" y="72" width="120" height="6" rx="2" fill="currentColor" opacity="0.45" />
      <rect x="30" y="84" width="140" height="6" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="30" y="96" width="100" height="6" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="46" y="116" width="100" height="5" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="46" y="126" width="80" height="5" rx="2" fill="currentColor" opacity="0.3" />
      <line x1="14" y1="40" x2="170" y2="40" stroke="currentColor" opacity="0.18" />
    </svg>
  );
}

function PerformanceVisual() {
  const radius = 60;
  const cx = 100;
  const cy = 110;
  const arc = (start: number, end: number, opacity: number) => {
    const sx = cx + Math.cos((start * Math.PI) / 180) * radius;
    const sy = cy + Math.sin((start * Math.PI) / 180) * radius;
    const ex = cx + Math.cos((end * Math.PI) / 180) * radius;
    const ey = cy + Math.sin((end * Math.PI) / 180) * radius;
    return (
      <path
        d={`M ${sx} ${sy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity={opacity}
        strokeLinecap="round"
      />
    );
  };
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {arc(180, 240, 0.7)}
      {arc(240, 300, 0.5)}
      {arc(300, 360, 0.35)}
      {[180, 210, 240, 270, 300, 330, 360].map((deg, i) => {
        const x1 = cx + Math.cos((deg * Math.PI) / 180) * (radius + 4);
        const y1 = cy + Math.sin((deg * Math.PI) / 180) * (radius + 4);
        const x2 = cx + Math.cos((deg * Math.PI) / 180) * (radius + 12);
        const y2 = cy + Math.sin((deg * Math.PI) / 180) * (radius + 12);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" opacity={0.35} />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.cos((290 * Math.PI) / 180) * (radius - 8)}
        y2={cy + Math.sin((290 * Math.PI) / 180) * (radius - 8)}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3.5" fill="currentColor" />
    </svg>
  );
}

function SchemaVisual() {
  const cx = 100;
  const cy = 80;
  const r = 44;
  const satellites = [
    { angle: -90, label: "{ }" },
    { angle: 0, label: "[ ]" },
    { angle: 90, label: "/" },
    { angle: 180, label: "@" },
  ];
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {satellites.map((s, i) => {
        const x = cx + Math.cos((s.angle * Math.PI) / 180) * r;
        const y = cy + Math.sin((s.angle * Math.PI) / 180) * r;
        return (
          <line
            key={`l-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.35"
            strokeDasharray="3 3"
          />
        );
      })}
      <circle cx={cx} cy={cy} r="14" fill="currentColor" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="monospace" fontSize="11" fill="white">
        JSON
      </text>
      {satellites.map((s, i) => {
        const x = cx + Math.cos((s.angle * Math.PI) / 180) * r;
        const y = cy + Math.sin((s.angle * Math.PI) / 180) * r;
        return (
          <g key={`s-${i}`}>
            <circle cx={x} cy={y} r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x={x} y={y + 3.5} textAnchor="middle" fontFamily="monospace" fontSize="10" fill="currentColor">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const VISUALS = [TechnicalVisual, OnPageVisual, PerformanceVisual, SchemaVisual];

function CapabilityRow({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.18 }
    );
    const node = ref.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Icon = ICONS[index] ?? Code;
  const Visual = VISUALS[index] ?? TechnicalVisual;

  return (
    <div
      ref={ref}
      className={`group transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-16 border-b border-foreground/10">
        <div className="shrink-0 flex items-baseline gap-4 lg:flex-col lg:items-start lg:gap-3 lg:w-16">
          <span className="font-mono text-sm text-foreground/45">0{index + 1}</span>
          <Icon className="w-5 h-5 text-foreground/85" strokeWidth={1.5} />
        </div>

        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3
              className="font-display tracking-tight mb-4 leading-tight transition-transform duration-500 group-hover:translate-x-1"
              style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.25rem)" }}
            >
              {title}
            </h3>
            <p className="text-base lg:text-lg text-foreground/65 leading-relaxed">{body}</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-52 h-40 text-foreground">
              <Visual />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesSection() {
  const { t } = useLocale();
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setHeaderVisible(true),
      { threshold: 0.2 }
    );
    const node = headerRef.current;
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="capabilities" className="relative py-24 lg:py-32 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div ref={headerRef} className="mb-16 lg:mb-24 max-w-3xl">
          <span className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.32em] text-foreground/55 mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            {t.capabilities.eyebrow}
          </span>
          <h2
            className={`font-display tracking-tight leading-[1.05] mb-6 transition-all duration-700 ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            {t.capabilities.h2Line1}
            <br />
            <span className="text-foreground/45">{t.capabilities.h2Line2}</span>
          </h2>
          <p
            className={`text-lg text-foreground/65 leading-relaxed max-w-xl transition-all duration-700 delay-150 ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {t.capabilities.sub}
          </p>
        </div>

        <div>
          {t.capabilities.items.map((c, i) => (
            <CapabilityRow key={i} index={i} title={c.title} body={c.body} />
          ))}
        </div>
      </div>
    </section>
  );
}
