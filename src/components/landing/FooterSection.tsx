"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useLocale } from "@/lib/locale";
import { AnimatedWave } from "./AnimatedWave";

export function FooterSection() {
  const { t } = useLocale();

  return (
    <footer className="relative border-t border-foreground/10 bg-background overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 opacity-30 pointer-events-none">
        <AnimatedWave />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-foreground" />
                <span className="font-mono uppercase tracking-[0.22em] text-sm font-medium">
                  {BRAND.agency}
                </span>
              </Link>

              <p className="text-foreground/65 leading-relaxed mb-8 max-w-xs">
                {BRAND.toolName} - {t.footer.tagline}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {t.footer.social.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="text-sm text-foreground/65 hover:text-foreground transition-colors flex items-center gap-1 group"
                  >
                    {l.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-medium mb-6">{col.title}</h3>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-foreground/65 hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {link.label}
                        {"badge" in link && link.badge && (
                          <span className="text-[10px] px-2 py-0.5 bg-foreground text-background rounded-full font-medium">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-foreground/55">{t.footer.copyright}</p>
          <div className="flex items-center gap-4 text-sm text-foreground/55">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t.footer.status}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
