"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2, Presentation } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { MONTHS, SUMMARY_ROWS, type MonthPhase } from "@/lib/seoProcessData";

// 3-month client-facing SEO process - narrative + monthly milestones.
// Plain Georgian, no jargon-only sentences. Echoes Google's framing of
// search (crawl → index → rank) in everyday language.


export default function ClientPlanContent() {
  const searchParams = useSearchParams();

  const rawDomain =
    searchParams.get("url") ?? searchParams.get("domain") ?? "";
  let displayDomain = "თქვენი საიტი";
  let hasRealDomain = false;
  let hostnameOnly: string | undefined;
  if (rawDomain.trim()) {
    hasRealDomain = true;
    try {
      const candidate = rawDomain.startsWith("http")
        ? rawDomain
        : `https://${rawDomain}`;
      const parsed = new URL(candidate);
      displayDomain = parsed.hostname.replace(/^www\./, "");
      hostnameOnly = parsed.hostname;
    } catch {
      displayDomain = rawDomain.trim();
    }
  }

  // Keywords only shown when explicitly provided via ?keywords=a,b,c
  // (typically from the audit form when the client supplies them).
  // Auto-extraction from page text was producing misleading phrases -
  // word salad from titles/headings rarely matches real search terms.
  const keywordsParam = searchParams.get("keywords") ?? "";
  const keywords = keywordsParam
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const [pptxExporting, setPptxExporting] = useState(false);
  const [pptxError, setPptxError] = useState<string | null>(null);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handlePptx = async () => {
    if (pptxExporting) return;
    setPptxExporting(true);
    setPptxError(null);
    try {
      const { exportSeoProcessPptx } = await import("@/lib/seoProcessPptx");
      await exportSeoProcessPptx({
        domain: displayDomain,
        hasRealDomain,
        keywords,
      });
    } catch (e) {
      console.error("PPTX export failed", e);
      setPptxError(e instanceof Error ? e.message : String(e));
    } finally {
      setPptxExporting(false);
    }
  };

  return (
    <main className="seo-process-root min-h-screen bg-background text-foreground">
      <article className="max-w-[860px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
        {/* Cover header */}
        <header className="mb-12 pb-10 border-b border-border relative">
          <div
            data-print-hide
            className="absolute top-0 right-0 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handlePptx}
              disabled={pptxExporting}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-foreground/15 bg-background text-foreground text-[12px] font-medium hover:bg-foreground/[0.04] transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="PowerPoint-ის ფაილი (.pptx) - ედიტირებადი"
            >
              {pptxExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Presentation className="w-3.5 h-3.5" strokeWidth={2.25} />
              )}
              {pptxExporting ? "ექსპორტი..." : "PowerPoint"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition"
              title="PDF - ბრაუზერის Print → Save as PDF"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.25} />
              PDF
            </button>
          </div>
          {pptxError && (
            <p
              data-print-hide
              className="absolute top-12 right-0 text-[11px] text-[var(--error)]"
            >
              PPTX ვერ მოვამზადეთ: {pptxError}
            </p>
          )}
          <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-5">
            {BRAND.agency} · SEO PROCESS · 2026
          </p>
          <h1
            className="font-display tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            თქვენი SEO პროცესი
          </h1>
          {hasRealDomain ? (
            <p className="text-lg text-foreground-muted">
              საიტი:{" "}
              <span className="font-medium text-foreground">{displayDomain}</span>
            </p>
          ) : (
            <p className="text-lg text-foreground-muted">ნიმუშის გვერდი</p>
          )}
        </header>

        {/* Intro */}
        <section className="mb-12">
          <p className="text-[17px] leading-relaxed text-foreground/85 mb-4">
            სამთვიანი ოპტიმიზაცია
            სამ მკაფიო ეტაპად იყოფა -{" "}
            <strong className="font-semibold">პირველი თვე ქმნის საფუძველს</strong>,{" "}
            <strong className="font-semibold">მეორე თვე აძლიერებს საიტს</strong>,{" "}
            <strong className="font-semibold">მესამე თვე გვაჩვენებს მიმართულებას</strong>,
            საიდანაც უკვე უფრო სერიოზული ზრდის გაგრძელებაა შესაძლებელი.
          </p>

          {/* Visual 3-step at-a-glance */}
          <div className="grid sm:grid-cols-3 gap-3 mb-8 print:break-inside-avoid">
            {[
              { label: "I თვე", caption: "საფუძველი" },
              { label: "II თვე", caption: "გაძლიერება" },
              { label: "III თვე", caption: "მიმართულება" },
            ].map((step, i) => (
              <div
                key={step.label}
                className="rounded-xl border border-border bg-surface p-4 text-center"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-2">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="font-display text-xl mb-1">{step.label}</p>
                <p className="text-[13px] text-foreground/85">{step.caption}</p>
              </div>
            ))}
          </div>

          <p className="text-[15.5px] leading-relaxed text-foreground/85 mb-4">
            ქვემოთ მოცემულია სამი თვის გეგმა - რას გავაკეთებთ თვეების
            მიხედვით და რა შედეგი მოაქვს თითო ეტაპს. პროცესის ნებისმიერ
            ნაბიჯზე საიტი უსაფრთხოდ მუშაობს, ცვლილებები ხდება ფრთხილად
            და შერჩევით.
          </p>
          <p className="text-[14px] leading-relaxed text-foreground-muted">
            SEO არ იძლევა ერთ დღეში შედეგს - რეალური ცვლილებები 2-4 თვის
            შემდეგ ჩანს. პირველი ადგილის გარანტიას არც Google-ი იძლევა.
            ჩვენი მუშაობა ეფუძნება ეტაპობრივ ცვლილებას და მონაცემზე
            დაფუძნებულ გაზომვას.
          </p>
        </section>

        {/* Keywords - only when explicitly provided via ?keywords= */}
        {keywords.length > 0 && (
          <section className="mb-12 rounded-2xl border border-border bg-surface p-6 lg:p-8 print:break-inside-avoid">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-3">
              - საძიებო ფრაზები
            </p>
            <h2
              className="font-display tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}
            >
              რა ფრაზებზე ვმუშაობთ
            </h2>
            <p className="text-sm text-foreground-muted leading-relaxed mb-5">
              ეს არის თქვენგან მოწოდებული საძიებო ფრაზები. Keyword
              Research-ის შემდეგ სია გაფართოვდება და დაზუსტდება -
              შემოვამატებთ კონკურენტთა მონაცემებს და რეალურ მოცულობას
              Google-დან.
            </p>
            <ul className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <li
                  key={`${kw}-${i}`}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-foreground/15 bg-background text-[13px] text-foreground"
                >
                  <span className="font-mono text-[10px] text-foreground-muted mr-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {kw}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 3-month process */}
        <section className="space-y-10">
          {MONTHS.map((m) => (
            <MonthCard key={m.num} month={m} />
          ))}
        </section>

        {/* Short summary text */}
        <section className="mt-14 pt-10 border-t border-border">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-3">
            - შემაჯამებლად
          </p>
          <h2
            className="font-display tracking-tight leading-tight mb-5"
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
          >
            3-თვიანი SEO ოპტიმიზაცია - მოკლედ
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85 mb-8">
            <p>
              მუშაობა დაიყოფა ეტაპებად. პირველ თვეში ძირითადი აქცენტი
              გაკეთდება საიტის აუდიტზე, ტექნიკურ მოწესრიგებაზე, ინდექსაციის
              შემოწმებაზე და საწყის On-page SEO ოპტიმიზაციაზე. ამ ეტაპზე
              დავადგენთ, რა უშლის ხელს საიტს Google-ში უკეთ გამოჩენაში და
              რა მიმართულებით უნდა განვითარდეს SEO სტრატეგია.
            </p>
            <p>
              მეორე თვეში გადავდივართ გვერდების გაძლიერებაზე: ვამუშავებთ
              მთავარ სერვისებს ან პროდუქტებს, ვასწორებთ სათაურებს,
              აღწერებს, ტექსტებს, შიდა ბმულებს და ვამზადებთ კონტენტის
              განვითარების გეგმას. მიზანია, საიტის მნიშვნელოვანი გვერდები
              უკეთ პასუხობდეს მომხმარებლის საძიებო მოთხოვნებს.
            </p>
            <p>
              მესამე თვეში უკვე ვაკვირდებით მიღებულ მონაცემებს,
              ვაანალიზებთ Google Search Console-სა და Analytics-ს, ვადგენთ
              რომელი გვერდები აჩვენებს ზრდის პოტენციალს და ვამზადებთ
              მომდევნო SEO სტრატეგიას. თვის ბოლოს კლიენტი იღებს შეჯამებულ
              ანგარიშს შესრულებული სამუშაოებით, აღმოჩენილი შედეგებით და
              შემდეგი ნაბიჯებით.
            </p>
          </div>

          {/* Simplest possible table view */}
          <div className="rounded-xl border border-border overflow-hidden print:break-inside-avoid">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3D3D3D] text-white text-left">
                  <th className="px-4 py-3 text-[12px] font-medium">თვე</th>
                  <th className="px-4 py-3 text-[12px] font-medium">მთავარი აქცენტი</th>
                  <th className="px-4 py-3 text-[12px] font-medium">მიზანი</th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY_ROWS.map((row, i) => (
                  <tr
                    key={row.month}
                    className={i % 2 === 1 ? "bg-zinc-50" : "bg-white"}
                  >
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground border-t border-border">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground/85 border-t border-border">
                      {row.focus}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground/85 border-t border-border">
                      {row.goal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-xl bg-foreground/[0.04] border border-border p-5 print:break-inside-avoid">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-2">
              - რეპორტი ყოველი თვის ბოლოს
            </p>
            <p className="text-[15px] leading-relaxed text-foreground/85">
              მკაფიო ანგარიში: შესრულებული სამუშაოები, აღმოჩენილი
              პრობლემები, გასწორებული გვერდები, რეალური მონაცემები
              (ტრაფიკი, რანკი, კონვერსიები), შემდეგი თვის პრიორიტეტი და
              თქვენგან საჭირო მასალები - ტექსტი, ფოტო, აღწერა.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-2">
            {BRAND.agency} - SEO სააგენტო
          </p>
        </footer>
      </article>
    </main>
  );
}

function MonthCard({ month }: { month: MonthPhase }) {
  return (
    <article className="rounded-xl border border-border bg-background p-6 lg:p-8 print:break-inside-avoid">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground-muted mb-2">
          {month.num}
        </p>
        <h3
          className="font-display tracking-tight leading-tight"
          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
        >
          {month.title}
        </h3>
      </header>

      <p className="text-[15.5px] leading-relaxed text-foreground/85 mb-3">
        {month.focus}
      </p>
      <p className="text-[14.5px] leading-relaxed text-foreground-muted mb-6">
        {month.body}
      </p>

      <div className="mb-5">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground-muted mb-3">
          - ამ თვეში შესრულდება
        </p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full border-collapse">
            <tbody>
              {month.rows.map((row, i) => (
                <tr
                  key={`${row.process}-${i}`}
                  className={i % 2 === 1 ? "bg-zinc-50/60" : "bg-white"}
                >
                  <td className="px-4 py-2.5 text-[13.5px] font-medium text-foreground align-top w-[40%] border-t border-zinc-100">
                    {row.process}
                  </td>
                  <td className="px-4 py-2.5 text-[13.5px] text-foreground/85 align-top border-t border-zinc-100">
                    {row.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground-muted mb-2">
          - ამ თვის შედეგი
        </p>
        <p className="text-[14.5px] leading-relaxed text-foreground/85 italic">
          {month.result}
        </p>
      </div>
    </article>
  );
}
