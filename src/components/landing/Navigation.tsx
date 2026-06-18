"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { LOCALES, type Locale } from "@/lib/i18n";

export function Navigation() {
  const { locale, setLocale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: t.nav.features, href: "#capabilities" },
    { label: t.nav.process, href: "#process" },
    { label: t.nav.compare, href: "/compare" },
    { label: t.nav.faq, href: "#faq" },
  ];

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        scrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          scrolled || mobileOpen
            ? "max-w-[1180px] rounded-2xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_85%,transparent)] shadow-[0_4px_28px_-12px_rgba(10,10,10,0.18)] backdrop-blur-xl"
            : "max-w-[1400px] border border-transparent bg-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 lg:px-8 transition-all duration-500 ${
            scrolled ? "h-14" : "h-20"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className={`inline-block rounded-full bg-foreground transition-all duration-500 ${
                scrolled ? "w-1.5 h-1.5" : "w-2 h-2"
              }`}
            />
            <span
              className={`font-mono uppercase tracking-[0.22em] font-medium transition-all duration-500 ${
                scrolled ? "text-[12px]" : "text-[13px]"
              }`}
            >
              {t.nav.brand}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm text-foreground/65 hover:text-foreground transition-colors duration-300 group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div
              role="group"
              aria-label={t.nav.langLabel}
              className="flex items-center rounded-full border border-foreground/15 overflow-hidden"
            >
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code as Locale)}
                  className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors ${
                    locale === l.code
                      ? "bg-foreground text-background"
                      : "text-foreground/55 hover:text-foreground"
                  }`}
                  aria-pressed={locale === l.code}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <a
              href="#hero"
              className={`inline-flex items-center gap-1.5 rounded-full bg-foreground text-background font-medium transition-all duration-500 hover:opacity-90 ${
                scrolled ? "h-8 px-4 text-xs" : "h-10 px-5 text-sm"
              }`}
            >
              {t.nav.cta}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((s) => !s)}
            className="md:hidden p-2"
            aria-label={t.nav.menu}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 top-0 z-40 bg-background transition-all duration-500 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex h-full flex-col px-8 pt-28 pb-8">
          <div className="flex justify-end mb-6">
            <div
              role="group"
              aria-label={t.nav.langLabel}
              className="flex items-center rounded-full border border-foreground/15 overflow-hidden"
            >
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code as Locale)}
                  className={`px-3 h-8 text-xs font-mono uppercase tracking-[0.18em] transition-colors ${
                    locale === l.code
                      ? "bg-foreground text-background"
                      : "text-foreground/55"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-7">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`font-display text-4xl text-foreground transition-all duration-500 ${
                  mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
                style={{ transitionDelay: mobileOpen ? `${i * 70}ms` : "0ms" }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href="#hero"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground text-background text-base font-medium"
          >
            {t.nav.cta}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
