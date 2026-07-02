"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  GitCompare,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/lib/locale";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { FooterSection } from "@/components/landing/FooterSection";

const PLATFORMS = [
  "WordPress",
  "Shopify",
  "Webflow",
  "Wix",
  "Magento",
  "Next.js",
  "Drupal",
  "Joomla",
  "Squarespace",
  "Ghost",
  "Custom",
  "Static",
];

const BLACK = "#0a0a0a";

function normalizeUrl(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

export default function Home() {
  const { t } = useLocale();
  const [, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <CapabilitiesSection />

      {/* PROCESS */}
      <section
        id="process"
        className="bg-[#0a0a0a] text-white border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/55 mb-4">
              {t.process.eyebrow}
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              {t.process.h2Line1}{" "}
              <span className="italic font-normal">{t.process.h2Line2}</span>
            </h2>
            <p className="text-lg text-white/65 leading-relaxed">
              {t.process.sub}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            {t.process.steps.map((s, i) => (
              <div key={i} className="relative">
                <div
                  className="font-semibold leading-none mb-6 text-white/15"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "5rem" }}
                >
                  0{i + 1}
                </div>
                <h3
                  className="font-semibold mb-3 leading-tight text-white"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}
                >
                  {s.title}
                </h3>
                <p className="text-white/65 leading-relaxed text-[15px]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-4">
              {t.metrics.eyebrow}
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5 text-[#0a0a0a]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              {t.metrics.h2Line1}{" "}
              <span className="italic font-normal">{t.metrics.h2Line2}</span>
            </h2>
            <p className="text-lg text-[#0a0a0a]/65 leading-relaxed">
              {t.metrics.sub}
            </p>
          </div>
          <div className="border border-[#0a0a0a]/10 rounded-2xl p-8 sm:p-10 bg-[#f7f7f8]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
              {t.metrics.cards.map((c, i) => (
                <MetricCard key={i} label={c.label} value={c.value} delta={c.delta} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-3">
              {t.platforms.eyebrow}
            </p>
            <h2
              className="font-semibold tracking-tight text-[#0a0a0a]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              }}
            >
              {t.platforms.h2Line1}{" "}
              <span className="italic font-normal">{t.platforms.h2Line2}</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px bg-[#0a0a0a]/10 border border-[#0a0a0a]/10 rounded-lg overflow-hidden">
            {PLATFORMS.map((p) => (
              <div
                key={p}
                className="bg-white py-7 px-4 flex items-center justify-center text-[13px] font-mono text-[#0a0a0a]/60 hover:bg-[#0a0a0a]/[0.02] hover:text-[#0a0a0a] transition"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT INFINITY */}
      <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-4">
                {t.about.eyebrow}
              </p>
              <h2
                className="font-semibold tracking-tight leading-[1.05] mb-6 text-[#0a0a0a]"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                }}
              >
                {t.about.h2Line1}{" "}
                <span className="italic font-normal">{t.about.h2Line2}</span>
              </h2>
              <p className="text-lg text-[#0a0a0a]/65 leading-relaxed mb-5">
                {t.about.p1}
              </p>
              <p className="text-lg text-[#0a0a0a]/65 leading-relaxed">
                {t.about.p2}
              </p>
            </div>
            <div className="space-y-px bg-[#0a0a0a]/10 border border-[#0a0a0a]/10 rounded-lg overflow-hidden">
              {t.about.details.map((d, i) => (
                <DetailRow key={i} kicker={d.kicker} title={d.title} body={d.body} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-[#0a0a0a] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/55 mb-4">
                {t.comparison.eyebrow}
              </p>
              <h2
                className="font-semibold tracking-tight leading-[1.05] mb-6"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                }}
              >
                {t.comparison.h2Line1}{" "}
                <span className="italic font-normal">{t.comparison.h2Line2}</span>
              </h2>
              <p className="text-lg text-white/65 leading-relaxed mb-8">
                {t.comparison.sub}
              </p>
              <ul className="space-y-3 mb-8 text-white/70">
                {t.comparison.points.map((p, i) => (
                  <ComparePoint key={i} dark>{p}</ComparePoint>
                ))}
              </ul>
              <a
                href="/compare"
                className="inline-flex items-center gap-2 text-white hover:text-white/80 font-semibold transition group border-b border-white/40 hover:border-white/70 pb-1"
              >
                {t.comparison.cta}
                <ArrowUpRight
                  className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                  strokeWidth={2.25}
                />
              </a>
            </div>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/55">
                  {t.comparison.scoreboardLabel}
                </span>
                <GitCompare className="w-4 h-4 text-white/40" />
              </div>
              <div className="space-y-4">
                {[
                  { name: "yoursite.ge", score: 78, accent: true },
                  { name: "competitor-1.ge", score: 84 },
                  { name: "competitor-2.ge", score: 71 },
                  { name: "competitor-3.ge", score: 65 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/40 w-4">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-[13px] font-mono truncate ${
                        s.accent ? "text-white font-semibold" : "text-white/75"
                      }`}
                    >
                      {s.name}
                    </span>
                    <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full ${s.accent ? "bg-white" : "bg-white/40"}`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-mono tabular-nums w-8 text-right text-white">
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {t.comparison.gapAnalysis}
                </span>
                <span className="text-[12px] text-white/65">
                  {t.comparison.gapNote}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI SEARCH */}
      <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center">
          <Sparkles
            className="w-6 h-6 text-[#0a0a0a] mx-auto mb-5"
            strokeWidth={1.5}
          />
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-4">
            {t.ai.eyebrow}
          </p>
          <h2
            className="font-semibold tracking-tight leading-[1.1] mb-6 text-[#0a0a0a]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            }}
          >
            {t.ai.h2Line1}{" "}
            <span className="italic font-normal">{t.ai.h2Line2}</span>
          </h2>
          <p className="text-lg text-[#0a0a0a]/65 leading-relaxed">
            {t.ai.body}
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {t.testimonials.items.length > 0 && <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-4">
              {t.testimonials.eyebrow}
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5 text-[#0a0a0a]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              {t.testimonials.h2Line1}{" "}
              <span className="italic font-normal">{t.testimonials.h2Line2}</span>
            </h2>
            <p className="text-lg text-[#0a0a0a]/65 leading-relaxed">
              {t.testimonials.sub}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-[#0a0a0a]/10 border border-[#0a0a0a]/10 rounded-lg overflow-hidden">
            {t.testimonials.items.map((tt, i) => (
              <TestimonialCard
                key={i}
                index={i + 1}
                total={t.testimonials.items.length}
                quote={tt.quote}
                name={tt.name}
                role={tt.role}
              />
            ))}
          </div>
        </div>
      </section>}

      {/* PRICING */}
      <section className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-4">
              {t.pricing.eyebrow}
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5 text-[#0a0a0a]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              {t.pricing.h2Line1}{" "}
              <span className="italic font-normal">{t.pricing.h2Line2}</span>
            </h2>
            <p className="text-lg text-[#0a0a0a]/65 leading-relaxed">
              {t.pricing.sub}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[#0a0a0a]/10 border border-[#0a0a0a]/10 rounded-lg overflow-hidden">
            {t.pricing.tiers.map((p, i) => (
              <PricingCard
                key={i}
                kicker={p.kicker}
                name={p.name}
                price={p.price}
                unit={p.unit}
                description={p.description}
                features={[...p.features]}
                cta={p.cta}
                ctaHref={p.ctaHref}
                highlighted={"highlighted" in p ? p.highlighted : false}
                popularLabel={t.pricing.popular}
              />
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-[#0a0a0a]/55">
            {t.pricing.footnote}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white border-b border-[#0a0a0a]/10">
        <div className="max-w-3xl mx-auto px-6 py-24 sm:py-32">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#0a0a0a]/55 mb-3 text-center">
            {t.faq.eyebrow}
          </p>
          <h2
            className="font-semibold tracking-tight leading-[1.05] mb-14 text-center text-[#0a0a0a]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4.5vw, 3rem)",
            }}
          >
            {t.faq.h2Line1}{" "}
            <span className="italic font-normal">{t.faq.h2Line2}</span>
          </h2>
          <div className="divide-y divide-[#0a0a0a]/10 border-y border-[#0a0a0a]/10">
            {t.faq.items.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex items-start justify-between gap-4 py-5 cursor-pointer list-none select-none">
                  <span className="font-medium text-[#0a0a0a] text-[16px] sm:text-[17px] leading-snug">
                    {f.q}
                  </span>
                  <ChevronDown
                    className="w-5 h-5 text-[#0a0a0a]/55 shrink-0 transition group-open:rotate-180 mt-0.5"
                    strokeWidth={1.75}
                  />
                </summary>
                <div className="pb-5 text-[#0a0a0a]/65 leading-relaxed text-[15px]">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#0a0a0a] text-white">
        <div className="max-w-3xl mx-auto px-6 py-28 sm:py-32 text-center">
          <h2
            className="font-semibold tracking-tight leading-[1.05] mb-5"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
            }}
          >
            {t.finalCta.h2Line1}{" "}
            <span className="italic font-normal">{t.finalCta.h2Line2}</span>
          </h2>
          <p className="text-lg text-white/65 mb-10">{t.finalCta.sub}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const finalUrl = (
                document.getElementById("final-url-input") as HTMLInputElement
              )?.value;
              if (!finalUrl) return;
              setUrl(finalUrl);
              setLoading(true);
              router.push(
                `/results?url=${encodeURIComponent(normalizeUrl(finalUrl))}`
              );
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
          >
            <input
              id="final-url-input"
              type="text"
              placeholder={t.finalCta.placeholder}
              disabled={loading}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="flex-1 px-4 py-3 rounded-lg border border-white/15 bg-white/[0.06] text-white placeholder:text-white/35 focus:outline-none focus:border-white/40 focus:bg-white/[0.1] transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0a0a0a] font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t.finalCta.btn}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      <FooterSection />

      {/* FAQPage JSON-LD for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}

// =====================================================================
// Small presentational helpers
// =====================================================================

function DetailRow({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-6">
      <div className="flex items-baseline gap-4">
        <span className="text-[10px] font-mono text-[#0a0a0a]/40 tracking-wider w-6 shrink-0">
          {kicker}
        </span>
        <div>
          <h3
            className="font-semibold mb-1 text-[#0a0a0a]"
            style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem" }}
          >
            {title}
          </h3>
          <p className="text-[14px] text-[#0a0a0a]/65 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function ComparePoint({
  children,
  dark,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[15px]">
      <Check
        className={`w-4 h-4 shrink-0 mt-1 ${dark ? "text-white" : "text-[#0a0a0a]"}`}
        strokeWidth={2.25}
      />
      <span>{children}</span>
    </li>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#0a0a0a]/45 mb-2">
        {label}
      </div>
      <div
        className="font-semibold leading-none text-[#0a0a0a] mb-2 tabular-nums"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
        }}
      >
        {value}
      </div>
      <div className="text-[12px] text-[#0a0a0a]/55 font-mono">{delta}</div>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  index,
  total,
}: {
  quote: string;
  name: string;
  role: string;
  index: number;
  total: number;
}) {
  return (
    <article className="bg-white p-8 md:p-10 hover:bg-[#0a0a0a]/[0.02] transition flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] font-mono text-[#0a0a0a]/40 tracking-wider">
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="text-2xl text-[#0a0a0a]/30 leading-none font-serif">
          &ldquo;
        </span>
      </div>
      <p
        className="text-[#0a0a0a] leading-relaxed mb-8 flex-1"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.125rem",
          lineHeight: "1.55",
        }}
      >
        {quote}
      </p>
      <div className="border-t border-[#0a0a0a]/10 pt-4">
        <div className="font-medium text-[#0a0a0a] text-[14px]">{name}</div>
        <div className="text-[12px] text-[#0a0a0a]/55 mt-0.5">{role}</div>
      </div>
    </article>
  );
}

function PricingCard({
  kicker,
  name,
  price,
  unit,
  description,
  features,
  cta,
  ctaHref,
  highlighted,
  popularLabel,
}: {
  kicker: string;
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  popularLabel: string;
}) {
  return (
    <article
      className={`p-8 md:p-10 flex flex-col ${
        highlighted ? "bg-[#0a0a0a] text-white" : "bg-white text-[#0a0a0a]"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <span
          className={`text-[11px] font-mono tracking-wider ${
            highlighted ? "text-white/45" : "text-[#0a0a0a]/40"
          }`}
        >
          {kicker} / 03
        </span>
        {highlighted && (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded bg-white text-[#0a0a0a]">
            {popularLabel}
          </span>
        )}
      </div>
      <h3
        className={`font-semibold mb-2 leading-tight ${
          highlighted ? "text-white" : "text-[#0a0a0a]"
        }`}
        style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem" }}
      >
        {name}
      </h3>
      <p
        className={`text-[14px] leading-relaxed mb-6 ${
          highlighted ? "text-white/65" : "text-[#0a0a0a]/65"
        }`}
      >
        {description}
      </p>
      <div className="mb-8 flex items-baseline gap-2">
        <span
          className="font-semibold tabular-nums"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.25rem, 4vw, 3rem)",
          }}
        >
          {price}
        </span>
        {unit && (
          <span
            className={`text-sm ${highlighted ? "text-white/55" : "text-[#0a0a0a]/55"}`}
          >
            {unit}
          </span>
        )}
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px]">
            <Check
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                highlighted ? "text-white" : "text-[#0a0a0a]"
              }`}
              strokeWidth={2.25}
            />
            <span className={highlighted ? "text-white/85" : "text-[#0a0a0a]/85"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-[14px] transition ${
          highlighted
            ? "bg-white text-[#0a0a0a] hover:opacity-90"
            : "bg-[#0a0a0a] text-white hover:opacity-90"
        }`}
      >
        {cta}
        <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
      </a>
    </article>
  );
}

// Palette colour kept available for future inline usage.
void BLACK;
