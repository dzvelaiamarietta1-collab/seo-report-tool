"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Palette, Presentation } from "lucide-react";
import { exportProposalPptx } from "@/lib/proposalPptx";

// 8-slide SEO proposal designed for client delivery. Each section is a
// fixed-aspect "slide" that page-breaks cleanly in print. Colours are
// controlled via two CSS custom props (`--prop-primary`, `--prop-accent`)
// so the proposal can be re-tinted to match a client's brand without
// touching component code.

type Preset = { name: string; primary: string; accent: string };

const COLOR_PRESETS: Preset[] = [
  { name: "Navy + Red", primary: "#001E4D", accent: "#E63946" },
  { name: "Forest + Amber", primary: "#1F3D2E", accent: "#D69E2E" },
  { name: "Black + Orange", primary: "#111111", accent: "#FF6B35" },
  { name: "Slate + Cyan", primary: "#1B2735", accent: "#06B6D4" },
  { name: "Plum + Pink", primary: "#2D1B3D", accent: "#E91E63" },
  { name: "Charcoal + Lime", primary: "#1A1A1A", accent: "#9ACD32" },
];

// YIQ luminance test - used to flip slide text between white and near-
// black depending on whether the user picked a dark or light primary.
// Without this, picking a pale primary (e.g. cream) leaves the cover
// rendering white-on-white.
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
}

function hostnameFromInput(raw: string): {
  hostname: string;
  brand: string;
  hasReal: boolean;
} {
  if (!raw.trim()) {
    return { hostname: "client.ge", brand: "CLIENT", hasReal: false };
  }
  try {
    const candidate = raw.startsWith("http") ? raw : `https://${raw}`;
    const u = new URL(candidate);
    const host = u.hostname.replace(/^www\./, "");
    const brand = host.split(".")[0].toUpperCase();
    return { hostname: host, brand, hasReal: true };
  } catch {
    return { hostname: raw.trim(), brand: raw.trim().toUpperCase(), hasReal: true };
  }
}

export default function ProposalContent() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") ?? searchParams.get("domain") ?? "";
  const initialBrand = searchParams.get("brand") ?? "";

  const [urlInput, setUrlInput] = useState(rawUrl);
  const [brandOverride, setBrandOverride] = useState(initialBrand);

  // Colour state - initialise from URL params if present so a saved proposal
  // link reopens with the same tint.
  const initialPrimary = searchParams.get("primary") ?? COLOR_PRESETS[0].primary;
  const initialAccent = searchParams.get("accent") ?? COLOR_PRESETS[0].accent;
  const [primary, setPrimary] = useState(initialPrimary);
  const [accent, setAccent] = useState(initialAccent);

  const { hostname, brand: autoBrand } = useMemo(
    () => hostnameFromInput(urlInput),
    [urlInput]
  );
  const brand = brandOverride.trim() || autoBrand;

  // Push the chosen colours into CSS custom properties on the root so
  // every slide picks them up via var(--prop-primary) etc. Also computes
  // a contrasting text colour based on the primary's luminance - light
  // primaries get dark text, dark primaries get white text. Same for
  // accent (used on small chips/buttons).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector(".proposal-root") as HTMLElement | null;
    if (!root) return;
    root.style.setProperty("--prop-primary", primary);
    root.style.setProperty("--prop-accent", accent);
    const primaryLight = isLightColor(primary);
    const accentLight = isLightColor(accent);
    root.style.setProperty(
      "--prop-on-primary",
      primaryLight ? "#0a0a0a" : "#FFFFFF"
    );
    root.style.setProperty(
      "--prop-on-primary-muted",
      primaryLight ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.82)"
    );
    root.style.setProperty(
      "--prop-on-primary-subtle",
      primaryLight ? "rgba(10,10,10,0.5)" : "rgba(255,255,255,0.6)"
    );
    root.style.setProperty(
      "--prop-on-accent",
      accentLight ? "#0a0a0a" : "#FFFFFF"
    );
    // Text-on-white fallback - if the brand colour is too pale to read as
    // a heading on a white slide, swap to a deep slate. Keeps the brand
    // tint where it can carry, falls back to readable ink where it can't.
    root.style.setProperty("--prop-ink", primaryLight ? "#0F172A" : primary);
    root.style.setProperty(
      "--prop-accent-ink",
      accentLight ? "#0F172A" : accent
    );
  }, [primary, accent]);

  const [pptxBusy, setPptxBusy] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handlePptx = async () => {
    if (pptxBusy) return;
    setPptxBusy(true);
    try {
      await exportProposalPptx({ brand, hostname, primary, accent });
    } finally {
      setPptxBusy(false);
    }
  };

  return (
    <main
      className="proposal-root min-h-screen bg-[#e7eaf0] py-6"
      style={{
        ["--prop-primary" as string]: primary,
        ["--prop-accent" as string]: accent,
      }}
    >
      {/* Top toolbar - hidden in print */}
      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-6 flex flex-wrap items-end gap-4 bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            დომენი
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="client.ge"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            ბრენდის სახელი
          </label>
          <input
            type="text"
            value={brandOverride}
            onChange={(e) => setBrandOverride(e.target.value)}
            placeholder={autoBrand}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            მთავარი
          </label>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-14 rounded-lg border border-zinc-300 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            აქცენტი
          </label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-14 rounded-lg border border-zinc-300 cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="h-10 px-5 rounded-lg bg-zinc-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-700 transition"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={handlePptx}
          disabled={pptxBusy}
          className="h-10 px-5 rounded-lg border border-zinc-300 text-zinc-900 text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Presentation className="w-4 h-4" />
          {pptxBusy ? "მუშავდება..." : "PPT"}
        </button>
      </div>

      {/* Preset palette swatches */}
      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-6 flex flex-wrap items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mr-2 inline-flex items-center gap-1.5">
          <Palette className="w-3 h-3" />
          მზა პალიტრები:
        </span>
        {COLOR_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setPrimary(p.primary);
              setAccent(p.accent);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-white border border-zinc-200 hover:border-zinc-400 transition text-xs text-zinc-700"
            title={p.name}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: p.primary }}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: p.accent }}
            />
            {p.name}
          </button>
        ))}
      </div>

      {/* Slide deck */}
      <div className="proposal-deck max-w-[1100px] mx-auto space-y-6 px-4">
        <CoverSlide brand={brand} hostname={hostname} />
        <PromiseSlide brand={brand} hostname={hostname} />
        <FrontsSlide brand={brand} hostname={hostname} />
        <KeywordsSlide brand={brand} hostname={hostname} />
        <EasyWinsSlide brand={brand} hostname={hostname} />
        <ServiceSlide brand={brand} hostname={hostname} />
        <RoadmapSlide brand={brand} hostname={hostname} />
        <PricingSlide brand={brand} hostname={hostname} />
        <ClosingSlide brand={brand} hostname={hostname} />
      </div>
    </main>
  );
}

// ─── slide chrome ──────────────────────────────────────────────────────

function SlideShell({
  children,
  dark = false,
  brand,
  hostname,
  pageNum,
  total = 9,
  showFooter = true,
}: {
  children: React.ReactNode;
  dark?: boolean;
  brand: string;
  hostname?: string;
  pageNum: number;
  total?: number;
  showFooter?: boolean;
}) {
  return (
    <section
      className="proposal-slide relative bg-white rounded-2xl shadow-[0_2px_24px_-8px_rgba(0,0,0,0.12)] overflow-hidden"
      style={
        dark
          ? {
              backgroundColor: "var(--prop-primary)",
              color: "var(--prop-on-primary)",
            }
          : undefined
      }
    >
      <div className="relative" style={{ aspectRatio: "16 / 9", minHeight: "440px" }}>
        <div className="absolute inset-0 p-10 lg:p-14 flex flex-col">
          {/* Brand mark top-right */}
          <div
            className="absolute top-6 right-8 text-[11px] font-bold tracking-[0.18em]"
            style={{ color: dark ? "#FFFFFF" : "var(--prop-ink)" }}
          >
            {brand}
          </div>
          {children}
          {showFooter && (
            <div
              className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-[10px] font-mono tracking-wider"
              style={{ color: dark ? "rgba(255,255,255,0.6)" : "#777" }}
            >
              <span style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--prop-ink)" }}>
                {dark ? "" : brand}
              </span>
              {hostname && <span>{hostname}</span>}
              <span>Page {pageNum} / {total}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className="text-[10.5px] font-mono uppercase tracking-[0.32em] mb-3"
      style={{
        color: dark ? "var(--prop-accent)" : "var(--prop-accent-ink)",
        opacity: dark ? 0.95 : 1,
      }}
    >
      {children}
    </p>
  );
}

function AccentRule() {
  return (
    <div
      className="h-[3px] w-12 my-2"
      style={{ background: "var(--prop-accent)" }}
    />
  );
}

// ─── slide components ─────────────────────────────────────────────────

function CoverSlide({
  brand,
  hostname,
}: {
  brand: string;
  hostname: string;
}) {
  return (
    <SlideShell brand={brand} dark pageNum={1} showFooter={false}>
      {/* Decorative geometric squares - fresh design, not template-derived */}
      <svg
        className="absolute bottom-12 left-10 opacity-90 pointer-events-none"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="20"
          width="120"
          height="120"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
        />
        <rect
          x="60"
          y="60"
          width="120"
          height="120"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />
        <rect
          x="40"
          y="40"
          width="100"
          height="100"
          fill="none"
          stroke="var(--prop-accent)"
          strokeWidth="2.5"
        />
      </svg>

      <div className="ml-auto max-w-[55%] mt-auto mb-auto">
        <Eyebrow dark>
          SEO წინადადება · საკვანძო სიტყვების სტრატეგია
        </Eyebrow>
        <h1
          className="font-bold leading-[0.95] tracking-tight mb-4 break-words"
          style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.8rem)", color: "var(--prop-on-primary)" }}
        >
          {hostname}
        </h1>
        <p
          className="text-lg mb-3"
          style={{ color: "var(--prop-on-primary-muted)" }}
        >
          რას გპირდებით - 6 თვის გეგმა და მიზნები
        </p>
        <AccentRule />
      </div>

      <div
        className="absolute bottom-8 left-0 right-0 text-center text-xs font-mono tracking-[0.2em]"
        style={{ color: "var(--prop-on-primary-muted)" }}
      >
        presented by{" "}
        <span style={{ color: "var(--prop-on-primary)", fontWeight: 600 }}>
          INFINITY SOLUTIONS
        </span>
      </div>
    </SlideShell>
  );
}

function PromiseSlide({ brand, hostname }: { brand: string; hostname: string }) {
  return (
    <SlideShell brand={brand} hostname={hostname} dark pageNum={2}>
      <Eyebrow dark>ჩვენი დაპირება</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-5"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.8rem)", color: "var(--prop-on-primary)" }}
      >
        6 თვეში - გაზომვადი შედეგი
      </h2>
      <AccentRule />
      <p
        className="text-[15px] leading-relaxed mb-8 max-w-[800px]"
        style={{ color: "var(--prop-on-primary-muted)" }}
      >
        ჩვენი მიდგომა ფოკუსირებულია იქ, სადაც შედეგი ყველაზე სწრაფად მოდის -
        ვიწრო ქივორდები, მაღალი განზრახვის ქივორდები, სადაც {hostname}-ს
        რეალური შანსი აქვს პირველ ადგილებზე ასვლის.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {[
          { num: "20+", label: "ქივორდი #1-3-ზე", hint: "სამიზნე პოზიციები 6 თვის ბოლოს" },
          { num: "1500+", label: "სიტყვა / თვეში", hint: "ახალი ოპტიმიზებული კონტენტი" },
          { num: "თვიური", label: "გამჭვირვალე რეპორტი", hint: "Search Console + Analytics" },
        ].map((s) => (
          <div
            key={s.label}
            className="border-l-[3px] pl-4 py-2"
            style={{ borderColor: "var(--prop-accent)" }}
          >
            <div
              className="font-bold leading-none mb-2"
              style={{
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                color: "var(--prop-on-primary)",
              }}
            >
              {s.num}
            </div>
            <div
              className="text-[13px] font-medium mb-1"
              style={{ color: "var(--prop-accent)" }}
            >
              {s.label}
            </div>
            <div
              className="text-[11.5px] leading-snug"
              style={{ color: "var(--prop-on-primary-subtle)" }}
            >
              {s.hint}
            </div>
          </div>
        ))}
      </div>

      <p
        className="mt-8 text-[12px] italic"
        style={{ color: "var(--prop-on-primary-subtle)" }}
      >
        ქვემოთ - ზუსტად სად და როგორ უზრუნველვყოფთ ამ შედეგებს.
      </p>
    </SlideShell>
  );
}

function FrontsSlide({ brand, hostname }: { brand: string; hostname: string }) {
  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={3}>
      <Eyebrow>შესაძლებლობა</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-5"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.8rem)", color: "var(--prop-ink)" }}
      >
        სად უზრუნველვყოფთ შედეგს - სამი ფრონტი
      </h2>
      <AccentRule />

      <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
        {[
          {
            num: "3",
            color: "#16A34A",
            textColor: "#16A34A",
            title: "დაცვა და განმტკიცება",
            hint: "უკვე #1-ზე მყოფი სეგმენტი - ვინარჩუნებთ და ვამაგრებთ",
          },
          {
            num: "6+",
            color: "var(--prop-accent)",
            textColor: "var(--prop-accent-ink)",
            title: "სწრაფი ზრდა",
            hint: "ვიწრო ქივორდები, სადაც #1-მდე მცირე ნაბიჯია",
          },
          {
            num: "2",
            color: "#DC2626",
            textColor: "#DC2626",
            title: "სტრატეგიული გაფართოება",
            hint: "ბრენდის ძირითადი პროდუქტების ახალ პოზიციებზე",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="border-l-[3px] pl-4 py-3 bg-zinc-50/60 rounded-r-lg"
            style={{ borderColor: card.color }}
          >
            <div
              className="font-bold leading-none mb-2"
              style={{ fontSize: "2.5rem", color: card.textColor }}
            >
              {card.num}
            </div>
            <div className="text-[13.5px] font-semibold text-zinc-900 mb-1">
              {card.title}
            </div>
            <div className="text-[11.5px] text-zinc-600 leading-snug">
              {card.hint}
            </div>
          </div>
        ))}
      </div>

      <div
        className="border-l-[3px] pl-4 py-3 rounded-r-lg mt-auto"
        style={{
          borderColor: "var(--prop-accent)",
          background: "var(--prop-primary)",
        }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1.5"
          style={{ color: "var(--prop-accent)" }}
        >
          ჩვენი ფოკუსი
        </p>
        <p
          className="text-[13px] leading-relaxed"
          style={{ color: "var(--prop-on-primary)" }}
        >
          მთელ ძალისხმევას ვამახვილებთ easy-win ჯგუფზე - დომინო ეფექტი:
          ერთი ვიწრო ქივორდი მეორეს ეხმარება, ვამაგრებთ #1-ის პოზიციებს
          და თანდათან ვაფართოვებთ ხილვადობას ბრენდის ძირითად პროდუქტებზე.
        </p>
      </div>
    </SlideShell>
  );
}

function KeywordsSlide({ brand, hostname }: { brand: string; hostname: string }) {
  const rows = [
    { kw: "ბრენდის სახელი (navigational)", target: "#1", action: "ვინარჩუნებთ პოზიციას", color: "#16A34A" },
    { kw: "მთავარი პროდუქტი / სერვისი", target: "#1", action: "ვინარჩუნებთ + ვამყარებთ", color: "#16A34A" },
    { kw: "ლოკაცია + სერვისი (გეო-SEO)", target: "#1", action: "ვინარჩუნებთ + ვამყარებთ", color: "#16A34A" },
    { kw: "მთავარი კატეგორია (transactional)", target: "→ #1", action: "ერთი ნაბიჯი - სამიზნე #1", color: "#D97706" },
    { kw: "კონკურენტული transactional", target: "→ #2-3", action: "კატეგორიას ვაძლიერებთ", color: "#D97706" },
    { kw: "Long-tail variations (10+)", target: "→ #1-3", action: "ცარიელი გვერდი მზადაა", color: "#D97706" },
    { kw: "Informational queries", target: "→ #1-3", action: "სუსტი კონკურენცია", color: "#D97706" },
    { kw: "ახალი კატეგორია / sub-product", target: "→ #1-3", action: "ვიწრო, მაღალი განზრახვა", color: "#D97706" },
    { kw: "მომდევნო ეტაპის keyword", target: "→ 1-ლი გვერდი", action: "ახალი კონტენტი + ბმული", color: "#DC2626" },
    { kw: "შემდგომი long-tail ფრაზები", target: "→ 1-ლი გვერდი", action: "long-tail სტრატეგია", color: "#DC2626" },
  ];

  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={4}>
      <Eyebrow>სამიზნე ქივორდები</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.4rem)", color: "var(--prop-ink)" }}
      >
        რას გამოვაჩენთ პირველ გვერდზე
      </h2>
      <AccentRule />

      <div className="mt-5 flex-1 overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr style={{ background: "var(--prop-primary)" }}>
              <th
                className="text-left font-semibold px-4 py-2.5 w-[55%]"
                style={{ color: "var(--prop-on-primary)" }}
              >
                ქივორდი
              </th>
              <th
                className="text-left font-semibold px-4 py-2.5 w-[15%]"
                style={{ color: "var(--prop-on-primary)" }}
              >
                სამიზნე
              </th>
              <th
                className="text-left font-semibold px-4 py-2.5"
                style={{ color: "var(--prop-on-primary)" }}
              >
                ჩვენი ქმედება
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-t border-zinc-100"
                style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
              >
                <td className="px-4 py-2 flex items-center gap-2.5">
                  <span
                    className="w-[3px] h-4 rounded-sm shrink-0"
                    style={{ background: r.color }}
                  />
                  <span className="text-zinc-800">{r.kw}</span>
                </td>
                <td
                  className="px-4 py-2 font-semibold"
                  style={{ color: r.color }}
                >
                  {r.target}
                </td>
                <td className="px-4 py-2 text-zinc-600">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

function EasyWinsSlide({ brand, hostname }: { brand: string; hostname: string }) {
  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={5}>
      <div className="flex items-center gap-3 mb-2">
        <span
          className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[12px] font-bold"
          style={{ background: "var(--prop-accent)", color: "var(--prop-on-accent)" }}
        >
          1
        </span>
        <Eyebrow>პრიორიტეტი · სწრაფი შედეგი</Eyebrow>
      </div>
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.4rem)", color: "var(--prop-ink)" }}
      >
        Easy Wins - აქ უზრუნველვყოფთ #1-ს ჯერ
      </h2>
      <AccentRule />

      <div className="grid grid-cols-2 gap-3 mt-5">
        {[
          {
            kw: "მთავარი კატეგორია (transactional)",
            target: "სამიზნე #1",
            note: "title/H1 ოპტიმიზაცია + შიდა ბმულების გადანაწილება. ერთი ნაბიჯია #1-მდე.",
          },
          {
            kw: "ლოკაცია-სპეციფიკური ფრაზა",
            target: "სამიზნე #2-3",
            note: "კატეგორიის გვერდს ვაძლიერებთ კონტენტით და მეტი მონაცემით. #1 - მისაღწევია.",
          },
        ].map((c) => (
          <div
            key={c.kw}
            className="border-2 rounded-lg p-4"
            style={{ borderColor: "var(--prop-accent)" }}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="text-[13.5px] font-semibold text-zinc-900">
                {c.kw}
              </span>
              <span
                className="text-[11px] font-bold whitespace-nowrap"
                style={{ color: "var(--prop-accent-ink)" }}
              >
                {c.target}
              </span>
            </div>
            <p className="text-[12px] text-zinc-600 leading-relaxed">{c.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 mb-3 text-[12px] font-medium text-zinc-700">
        + ვიწრო ქივორდები, სადაც კონკურენცია სუსტია და გვერდები უკვე გვაქვს
      </p>

      <div className="grid grid-cols-3 gap-2">
        {[
          "მთავარი sub-category",
          "Long-tail variation 1",
          "თავისუფალი ნიშა",
          "ბრენდი + სერვისი",
          "კონკურენტული informational",
          "სეზონური მოდიფიკაცია",
        ].map((kw) => (
          <div
            key={kw}
            className="border rounded-lg px-3 py-2 text-[11.5px] text-zinc-700"
            style={{ borderColor: "var(--prop-accent)", opacity: 0.85 }}
          >
            {kw}
          </div>
        ))}
      </div>

      <p className="mt-auto text-[11px] italic text-zinc-500">
        სწორი on-page-ით 6 თვეში #1-3 პოზიციები სრულად მიღწევადია.
      </p>
    </SlideShell>
  );
}

function ServiceSlide({ brand, hostname }: { brand: string; hostname: string }) {
  const cols = [
    {
      num: "01",
      title: "ტექნიკური ოპტიმიზაცია",
      items: [
        "სრული ტექნიკური აუდიტი",
        "Core Web Vitals - სიჩქარე",
        "Schema markup დანერგვა",
        "llms.txt AI ძიებისთვის",
      ],
    },
    {
      num: "02",
      title: "On-Page",
      items: [
        "საძიებო სიტყვების კვლევა",
        "Keyword mapping ყველა გვერდს",
        "1500+ სიტყვა / თვეში კონტენტი",
        "Title & Meta ოპტიმიზაცია",
      ],
    },
    {
      num: "03",
      title: "Off-Page",
      items: [
        "ბექლინკ პროფილის ანალიზი",
        "თვეში 3+ ბექლინკი",
        "PR სტატიები (შეთანხმებით)",
        "Domain Authority მონიტორინგი",
      ],
    },
    {
      num: "04",
      title: "რეპორტინგი",
      items: [
        "თვიური სამუშაოს ანგარიში",
        "პოზიციების დინამიკა",
        "Clicks & Impressions",
        "Search Console + Analytics",
      ],
    },
  ];
  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={6}>
      <Eyebrow>სერვისის შემადგენლობა</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.4rem)", color: "var(--prop-ink)" }}
      >
        რას მოიცავს ჩვენი SEO სერვისი
      </h2>
      <AccentRule />

      <div className="grid grid-cols-4 gap-3 mt-6">
        {cols.map((c) => (
          <div
            key={c.num}
            className="border rounded-lg p-4"
            style={{ borderColor: "var(--prop-accent)" }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--prop-accent-ink)" }}
            >
              {c.num}
            </div>
            <div
              className="text-[14px] font-bold mb-3"
              style={{ color: "var(--prop-ink)" }}
            >
              {c.title}
            </div>
            <ul className="space-y-1.5 text-[11.5px] text-zinc-700">
              {c.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-400">·</span>
                  <span className="leading-snug">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function RoadmapSlide({ brand, hostname }: { brand: string; hostname: string }) {
  // headerText - colour used for the month label/tag rendered on top of
  // the coloured header band. bulletColor - colour for the bullet glyph
  // shown on the white card body. Months that use brand CSS vars must
  // resolve to readable fallbacks; static hex months stay literal.
  // Alternate primary / accent across the 6 months for a clean brand-
  // aligned rhythm (instead of a 6-colour rainbow). Each month's header
  // band picks one of the two brand colours and its readable text token.
  const PRIMARY_MONTH = {
    color: "var(--prop-primary)",
    headerText: "var(--prop-on-primary)",
    bulletColor: "var(--prop-ink)",
  };
  const ACCENT_MONTH = {
    color: "var(--prop-accent)",
    headerText: "var(--prop-on-accent)",
    bulletColor: "var(--prop-accent-ink)",
  };
  const months = [
    {
      label: "თვე 1", tag: "საფუძველი", ...PRIMARY_MONTH,
      items: [
        "ტექნიკური აუდიტი + ხარვეზების გასწორება",
        "გაზომვების პოზიციების დაცვა",
        "title/H1/ბმულების ოპტიმიზაცია",
      ],
    },
    {
      label: "თვე 2", tag: "ბიჯი", ...ACCENT_MONTH,
      items: [
        "კატეგორიის გვერდების კონტენტი",
        "6 ვიწრო ქივორდი - გვერდების ოპტიმიზაცია",
        "სიღრმისეული კონტენტის დანერგვა",
      ],
    },
    {
      label: "თვე 3", tag: "ზრდა", ...PRIMARY_MONTH,
      items: [
        "Easy wins - #1 დამაგრება",
        "ვიწრო ქივორდები - #1-3 ფიქსაცია",
        "Long-tail - 1-ელ გვერდზე შესვლა",
      ],
    },
    {
      label: "თვე 4", tag: "გაფართოება", ...ACCENT_MONTH,
      items: [
        "ახალი კატეგორიების კონტენტი",
        "Long-tail ქივორდების მასშტაბი",
        "In-depth სტატიების სერია",
      ],
    },
    {
      label: "თვე 5", tag: "ავტორიტეტი", ...PRIMARY_MONTH,
      items: [
        "Off-page - 5+ ხარისხიანი ბექლინკი",
        "PR სტატიები პროფილურ ჟურნალებში",
        "Brand mention-ების ზრდა",
      ],
    },
    {
      label: "თვე 6", tag: "დომინაცია", ...ACCENT_MONTH,
      items: [
        "#1 პოზიციების სრული ფიქსაცია",
        "მომდევნო ეტაპის ქივორდები",
        "6-თვიანი შედეგების კონსოლიდაცია",
      ],
    },
  ];
  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={7}>
      <Eyebrow>სამოქმედო გეგმა</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.4rem)", color: "var(--prop-ink)" }}
      >
        6-თვიანი როადმეფი
      </h2>
      <AccentRule />

      <div className="grid grid-cols-3 gap-3 mt-5">
        {months.map((m) => (
          <div key={m.label} className="rounded-lg border border-zinc-200 overflow-hidden">
            <div
              className="px-3 py-2"
              style={{ background: m.color }}
            >
              <div
                className="text-[9px] font-mono uppercase tracking-wider"
                style={{ color: m.headerText, opacity: 0.7 }}
              >
                {m.label}
              </div>
              <div
                className="text-[14px] font-bold leading-tight"
                style={{ color: m.headerText }}
              >
                {m.tag}
              </div>
            </div>
            <ul className="p-3 space-y-1.5 text-[11px] text-zinc-700">
              {m.items.map((it, i) => (
                <li key={i} className="flex gap-1.5 leading-snug">
                  <span style={{ color: m.bulletColor }}>•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function PricingSlide({ brand, hostname }: { brand: string; hostname: string }) {
  // Decoy / anchor pricing - Basic intentionally omits "ბექლინკები" so it
  // reads as a starter package, Standard is the visually highlighted
  // sweet-spot, Premium is overloaded to nudge the buyer back to Standard.
  const tiers = [
    {
      name: "ბაზისური",
      price: "1000₾",
      tagline: "თვიური · დასაწყისად",
      items: [
        "პროდუქტების ოპტიმიზაცია",
        "რესპონსიული დიზაინი",
        "საიტის არქიტექტურა",
        "ბრენდის ცნობადობა",
        "საიტის რუკა (Sitemap)",
        "პროდუქტების სორტირება",
        "ლოკალური SEO",
        "ტექნიკური SEO",
      ],
      featured: false,
    },
    {
      name: "სტანდარტული",
      price: "1200₾",
      tagline: "თვიური · საუკეთესო ღირებულება",
      items: [
        "პროდუქტების ოპტიმიზაცია",
        "რესპონსიული დიზაინი",
        "საიტის არქიტექტურა",
        "ბრენდის ცნობადობა",
        "საიტის რუკა (Sitemap)",
        "პროდუქტების სორტირება",
        "ბექლინკების მშენებლობა",
        "ლოკალური SEO",
        "ტექნიკური SEO",
        "ბლოგის წერა",
        "CTR-ის გაუმჯობესება",
      ],
      featured: true,
    },
    {
      name: "პრემიუმი",
      price: "1500₾",
      tagline: "თვიური · სრული პაკეტი",
      items: [
        "პროდუქტების ოპტიმიზაცია",
        "რესპონსიული დიზაინი",
        "საიტის არქიტექტურა",
        "ბრენდის ცნობადობა",
        "საიტის რუკა (Sitemap)",
        "პროდუქტების სორტირება",
        "ბექლინკების მშენებლობა",
        "ლოკალური SEO",
        "ტექნიკური SEO",
        "ბლოგის წერა",
        "CTR-ის გაუმჯობესება",
        "მობილური ვერსია + გასწორება",
        "Page Speed ოპტიმიზაცია",
        "მეტა-ტეგები (Title/Description)",
        "სურათების ოპტიმიზაცია (alt + შეკუმშვა)",
      ],
      featured: false,
    },
  ];

  return (
    <SlideShell brand={brand} hostname={hostname} pageNum={8}>
      <Eyebrow>ჩვენი პაკეტები</Eyebrow>
      <h2
        className="font-bold leading-tight tracking-tight mb-2"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.4rem)", color: "var(--prop-ink)" }}
      >
        აირჩიე შენი პაკეტი
      </h2>
      <AccentRule />

      <div className="grid grid-cols-3 gap-3 mt-5 items-start">
        {tiers.map((t) => (
          <div
            key={t.name}
            className="relative rounded-xl overflow-hidden border"
            style={{
              borderColor: t.featured ? "var(--prop-accent)" : "#e4e4e7",
              borderWidth: t.featured ? "2px" : "1px",
              background: t.featured ? "var(--prop-primary)" : "#FFFFFF",
              boxShadow: t.featured
                ? "0 10px 30px -10px rgba(0,0,0,0.25)"
                : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {t.featured && (
              <div
                className="absolute top-3 right-3 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-1"
                style={{
                  background: "var(--prop-accent)",
                  color: "var(--prop-on-accent)",
                }}
              >
                <span>★</span>
                <span>პოპულარული</span>
              </div>
            )}

            <div className="px-4 pt-4 pb-3">
              <div
                className="text-[11px] font-mono uppercase tracking-[0.18em] mb-1.5"
                style={{
                  color: t.featured ? "var(--prop-on-primary-muted)" : "#71717a",
                }}
              >
                {t.name}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="font-bold leading-none"
                  style={{
                    fontSize: "2rem",
                    color: t.featured ? "var(--prop-accent)" : "var(--prop-ink)",
                  }}
                >
                  {t.price}
                </span>
                <span
                  className="text-[13px] font-medium"
                  style={{
                    color: t.featured ? "var(--prop-on-primary-subtle)" : "#a1a1aa",
                  }}
                >
                  -დან
                </span>
              </div>
              <div
                className="text-[10.5px]"
                style={{
                  color: t.featured ? "var(--prop-on-primary-subtle)" : "#a1a1aa",
                }}
              >
                {t.tagline}
              </div>
            </div>

            <div
              className="mx-4 h-px"
              style={{
                background: t.featured
                  ? "rgba(255,255,255,0.12)"
                  : "#f4f4f5",
              }}
            />

            <ul
              className="px-4 py-3 space-y-1 text-[10.5px]"
              style={{
                color: t.featured ? "var(--prop-on-primary-muted)" : "#3f3f46",
              }}
            >
              {t.items.map((it, i) => (
                <li key={i} className="flex gap-1.5 leading-snug">
                  <span
                    className="shrink-0"
                    style={{
                      color: t.featured ? "var(--prop-accent)" : "var(--prop-ink)",
                    }}
                  >
                    ✓
                  </span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function ClosingSlide({ brand, hostname }: { brand: string; hostname: string }) {
  return (
    <SlideShell brand={brand} hostname={hostname} dark pageNum={9} showFooter={false}>
      <svg
        className="absolute top-1/2 left-12 -translate-y-1/2 opacity-90 pointer-events-none"
        width="180"
        height="180"
        viewBox="0 0 180 180"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
        />
        <rect
          x="50"
          y="50"
          width="100"
          height="100"
          fill="none"
          stroke="var(--prop-accent)"
          strokeWidth="2.5"
        />
      </svg>

      <div className="ml-auto max-w-[55%] mt-auto mb-auto">
        <Eyebrow dark>დავიწყოთ</Eyebrow>
        <h2
          className="font-bold leading-tight tracking-tight mb-5"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: "var(--prop-on-primary)" }}
        >
          მზად ვართ უზრუნველვყოთ
          <br />
          თქვენი #1 პოზიციები.
        </h2>
        <p
          className="text-[15px] leading-relaxed mb-8"
          style={{ color: "var(--prop-on-primary-muted)" }}
        >
          ფოკუსირებული 6-თვიანი გეგმა, გაზომვადი შედეგი და სრული გამჭვირვალობა
          ყოველთვიური რეპორტინგით. დავიწყოთ ვიწრო ქივორდებით, სადაც შედეგი
          ყველაზე სწრაფად მოდის.
        </p>
        <AccentRule />
        <div className="mt-4">
          <p className="text-[13px] font-bold tracking-[0.22em] text-white mb-1">
            INFINITY SOLUTIONS
          </p>
          <p
            className="text-[12px] font-mono"
            style={{ color: "var(--prop-on-primary-subtle)" }}
          >
            info@infinity.ge · +995 575 75 75 77
          </p>
        </div>
      </div>
    </SlideShell>
  );
}
