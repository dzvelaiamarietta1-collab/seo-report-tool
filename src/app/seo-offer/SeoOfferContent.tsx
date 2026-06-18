"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Wrench,
  FileText,
  Tag,
  Zap,
  Bot,
  Link as LinkIcon,
  Lightbulb,
  Target,
  PenTool,
  Users,
  ExternalLink,
  Megaphone,
  Star,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AnalysisResult, PageReport, PreviewData } from "@/lib/types";
import { storageKey } from "@/lib/presentation";
import { buildSeoOffer } from "@/lib/seoOffer";
import type {
  SeoOffer,
  ServiceCategory,
  ClientResponsibility,
  ServicePriority,
} from "@/lib/seoOffer";
import { BRAND } from "@/lib/brand";

interface StoredAnalysis {
  url: string;
  fetchedAt: string;
  analysis: AnalysisResult;
  preview?: PreviewData | null;
  subPages?: PageReport[] | null;
}

const ICONS: Record<string, LucideIcon> = {
  Wrench,
  FileText,
  Tag,
  Zap,
  Bot,
  Link: LinkIcon,
  Lightbulb,
  Target,
  PenTool,
  Users,
  ExternalLink,
  Megaphone,
  Star,
  Building,
};

const PRIORITY_LABEL: Record<ServicePriority, string> = {
  critical: "კრიტიკული",
  high: "მნიშვნელოვანი",
  medium: "საშუალო",
  low: "გასაუმჯობესებელი",
};

const PRIORITY_CLASS: Record<ServicePriority, string> = {
  critical: "bg-error/10 text-error",
  high: "bg-warning/10 text-warning",
  medium: "bg-accent-soft text-accent",
  low: "bg-surface text-foreground-muted",
};

function ServiceSection({ service }: { service: ServiceCategory }) {
  const Icon = ICONS[service.icon] ?? Sparkles;
  return (
    <section
      className="rounded-lg border border-border bg-surface/40 px-6 py-5 mb-4 print-keep-together"
      data-service={service.id}
    >
      <header className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-md bg-accent-soft shrink-0">
          <Icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {service.title}
          </h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {service.overview}
          </p>
        </div>
      </header>

      {service.items.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
            ⚡ თქვენი საიტის სპეციფიკური ფიქსები (audit-დან)
          </p>
          <ul className="space-y-2">
            {service.items.map((item, i) => (
              <li
                key={i}
                className="rounded border border-border bg-background px-3 py-2"
              >
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {item.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      PRIORITY_CLASS[item.priority]
                    }`}
                  >
                    {PRIORITY_LABEL[item.priority]}
                  </span>
                </div>
                <p className="text-[12px] text-foreground-muted leading-snug">
                  {item.rationale}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
          🟢 ჩვენი სტანდარტული deliverable-ები
        </p>
        <ul className="space-y-1">
          {service.staticDeliverables.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] text-foreground"
            >
              <CheckCircle2
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                strokeWidth={1.75}
              />
              <span className="leading-snug">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClientResponsibilityCard({
  resp,
}: {
  resp: ClientResponsibility;
}) {
  const Icon = ICONS[resp.icon] ?? Users;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/5 px-6 py-5 mb-4 print-keep-together">
      <header className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-md bg-warning/15 shrink-0">
          <Icon className="w-5 h-5 text-warning" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {resp.title}
          </h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {resp.reason}
          </p>
        </div>
      </header>

      <div className="mb-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
          რას მოიცავს
        </p>
        <ul className="space-y-1">
          {resp.examples.map((ex, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] text-foreground"
            >
              <AlertCircle
                className="w-4 h-4 text-warning shrink-0 mt-0.5"
                strokeWidth={1.75}
              />
              <span className="leading-snug">{ex}</span>
            </li>
          ))}
        </ul>
      </div>

      {resp.ourSupport && (
        <div className="rounded bg-background border border-border px-3 py-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-success mb-1">
            🟢 ჩვენი დახმარება
          </p>
          <p className="text-[13px] text-foreground leading-snug">
            {resp.ourSupport}
          </p>
        </div>
      )}
    </section>
  );
}

export default function SeoOfferContent() {
  const params = useSearchParams();
  const url = params.get("url");
  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError("URL არ არის მოწოდებული");
      return;
    }
    try {
      const raw =
        (typeof localStorage !== "undefined"
          ? localStorage.getItem(storageKey(url))
          : null) ??
        (typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(storageKey(url))
          : null);
      if (!raw) {
        setError(
          "ანალიზი ვერ მოიძებნა - ჯერ შეიყვანე URL მთავარ გვერდზე და გაუშვი ანალიზი."
        );
        return;
      }
      const parsed = JSON.parse(raw) as StoredAnalysis;
      setStored(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "მონაცემების წაკითხვის შეცდომა");
    }
  }, [url]);

  // useMemo here is mostly a hedge against re-renders; building the offer
  // is cheap (no async work) but it pulls in a non-trivial amount of
  // static template data, no point recomputing on each render.
  const offer = useMemo<SeoOffer | null>(() => {
    if (!stored?.analysis) return null;
    return buildSeoOffer(stored.analysis, {
      finalUrl: stored.analysis.finalUrl ?? stored.url,
    });
  }, [stored]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <p className="text-foreground-muted mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> მთავარზე დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-soft border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground-muted">შეთავაზება იქმნება...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
      <header className="mb-10 print-keep-together" data-print-hide-link="back">
        <div
          className="flex items-center justify-between mb-6 flex-wrap gap-2"
          data-print-hide
        >
          <Link
            href={`/results?url=${encodeURIComponent(url ?? "")}`}
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" /> ანალიზის შედეგებზე
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-medium text-sm transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            PDF / Print
          </button>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-accent mb-3">
          {BRAND.agency.toUpperCase()} · SEO Service Proposal
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-3 leading-tight">
          SEO შეთავაზება
        </h1>
        <p className="text-lg text-foreground-muted mb-4">
          მომზადებულია{" "}
          <span className="text-foreground font-medium">{offer.hostname}</span>
          -სთვის
        </p>
        <div className="flex items-center gap-4 text-[12px] font-mono text-foreground-muted">
          <span>
            {new Date(offer.generatedAt).toLocaleDateString("ka-GE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>·</span>
          <span>მიმდინარე ქულა: {offer.currentScore}/100</span>
        </div>
      </header>

      {/* Executive Summary */}
      <section className="mb-10 print-keep-together">
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          მოკლე მიმოხილვა
        </h2>
        <p className="text-base text-foreground leading-relaxed mb-4">
          {offer.executiveSummary}
        </p>
        {offer.topPriorities.length > 0 && (
          <div className="rounded-lg border border-accent/30 bg-accent-soft/30 px-5 py-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-accent mb-2">
              🎯 პრიორიტეტი #1 - ეს უნდა გავაკეთოთ პირველად
            </p>
            <ul className="space-y-1.5">
              {offer.topPriorities.map((p, i) => (
                <li
                  key={i}
                  className="text-[13px] text-foreground leading-snug"
                >
                  <span className="font-mono text-foreground-muted mr-1.5">
                    {i + 1}.
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Services - what WE do */}
      <section className="mb-10">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-success mb-2">
            🟢 რას ჩვენ ვაკეთებთ
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            სერვისები
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            ქვემოთ ჩამოწერილია სრული ტექნიკური SEO ექსპერტიზა, რომელსაც{" "}
            {BRAND.agency} მოგაწვდით. ცალკეული ფიქსები გენერირდება თქვენი
            საიტის რეალური audit-ის შედეგებიდან - გენერიკი არ არის.
          </p>
        </div>
        {offer.services.map((service) => (
          <ServiceSection key={service.id} service={service} />
        ))}
      </section>

      {/* Client Responsibilities */}
      <section className="mb-10">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-warning mb-2">
            👤 თქვენი მხარდანნ
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            კლიენტის ვალდებულებები
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            ეს ნაწილები <strong className="text-foreground">თქვენი</strong>{" "}
            ვალდებულებაა - SEO სპეციალისტი არ ფარავს ბრენდის შინაარსს,
            partnership-ებს, ფასიან რეკლამას ან customer reviews-ს. ჩვენ
            ვაძლევთ რჩევებს და frameworks-ს, მაგრამ მფლობელი თქვენ ხართ.
          </p>
        </div>
        {offer.clientResponsibilities.map((resp, i) => (
          <ClientResponsibilityCard key={i} resp={resp} />
        ))}
      </section>

      {/* Timeline */}
      <section className="mb-10 print-keep-together">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-2">
            ⏱ Timeline
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            12-თვიანი Roadmap
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            SEO გრძელვადიანი მუშაობაა - ხელშესახები შედეგი 3-6 თვეში ჩანს.
            ქვემოთ - ფაზური გეგმა.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {offer.timeline.map((phase, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface/40 px-5 py-4"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-1">
                {phase.label}
              </p>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {phase.title}
              </h3>
              <ul className="space-y-1">
                {phase.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-[12px] text-foreground-muted flex items-start gap-1.5 leading-snug"
                  >
                    <span className="text-foreground-subtle shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Expected Outcomes */}
      <section className="mb-10 print-keep-together">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-2">
            📈 მოსალოდნელი შედეგი
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            რა შედეგზე ვცდილობთ
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            ეს რეალისტური estimate-ებია, არა ფიქსირებული გარანტიები. SEO Google-ის
            ალგორითმზე და კონკურენტთა ქმედებებზე დამოკიდებულია.
          </p>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-foreground-muted">
                  მეტრიკა
                </th>
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-foreground-muted">
                  მიმდინარე
                </th>
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-foreground-muted">
                  მიზანი
                </th>
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-foreground-muted">
                  ვადა
                </th>
              </tr>
            </thead>
            <tbody>
              {offer.expectedOutcomes.map((outcome, i) => (
                <tr
                  key={i}
                  className="border-t border-border"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {outcome.metric}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted tabular-nums">
                    {outcome.current}
                  </td>
                  <td className="px-4 py-3 text-success font-medium tabular-nums">
                    {outcome.target}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted text-[12px]">
                    {outcome.timeframe}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Exclusions */}
      <section className="mb-10 print-keep-together">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-2">
            ⚠ რა არ შემოდის
          </p>
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            შეთავაზების ფარგლები
          </h2>
          <p className="text-base text-foreground-muted leading-relaxed">
            გამჭვირვალე ფარგლები - რომ ცხადი იყოს რა შემოდის ამ შეთავაზებაში
            და რა არა.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface/40 px-5 py-4">
          <ul className="space-y-2">
            {offer.exclusions.map((ex, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] text-foreground leading-snug"
              >
                <span className="text-error shrink-0 mt-0.5">✗</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-border text-center print-keep-together">
        <p className="text-sm text-foreground mb-2">
          მზად ვართ დაიწყოს მუშაობა?
        </p>
        <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-foreground-muted">
          {BRAND.agency.toUpperCase()}
        </p>
      </footer>
    </main>
  );
}
