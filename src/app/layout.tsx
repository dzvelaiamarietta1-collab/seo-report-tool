import type { Metadata } from "next";
import Script from "next/script";
import {
  Fira_Sans,
  Noto_Sans_Georgian,
  Noto_Serif_Georgian,
  JetBrains_Mono,
} from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Fira Sans is the Latin twin of FiraGO (FiraGO = Fira Sans + Georgian
// extension). For Georgian glyphs the cascade falls to Noto Sans Georgian.
// Both are loaded with the weights the design system uses.
const firaSans = Fira_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-fira-sans",
});

const notoGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-georgian",
});

// Editorial serif for headlines — pairs with the existing sans for body.
// The cover slide overrides with its own inline serif stack (Georgia +
// Playfair fallback) so it stays consistent in print/screenshots; this
// font carries the in-app h1/h2.
const notoSerifGeorgian = Noto_Serif_Georgian({
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-serif-georgian",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

// Canonical site URL — used by Open Graph / Twitter / canonical link.
// Update when the custom domain is wired up.
const SITE_URL = "https://seo-report-tool-pi.vercel.app";

// Verification codes — paste the value Google Search Console gives you
// (just the content="XXX" string, not the full <meta> tag). Leave the
// empty string until the user provides theirs; Next.js will skip the
// tag entirely instead of emitting an empty one.
const GOOGLE_VERIFICATION = "ZtiOihXRh6uFl2fDz0CvMw8Egvn3MjkCDag3olW5OGc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.toolName} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.toolName}`,
  },
  description: BRAND.description,
  keywords: [
    "SEO ანალიზი",
    "SEO აუდიტი",
    "ვებგვერდის ანალიზი",
    "SEO ხელსაწყო",
    "Google ranking",
    "Core Web Vitals",
    "SEO საქართველო",
    "ვებსაიტის SEO",
    "free SEO audit",
    "SEO report tool",
    "AI SEO",
    "llms.txt",
  ],
  authors: [{ name: BRAND.agency }],
  creator: BRAND.agency,
  publisher: BRAND.agency,
  applicationName: BRAND.toolName,
  category: "technology",
  // Open Graph — what Facebook/LinkedIn/iMessage etc. show when shared.
  openGraph: {
    type: "website",
    locale: "ka_GE",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: BRAND.toolName,
    title: `${BRAND.toolName} · ${BRAND.tagline}`,
    description: BRAND.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND.toolName} — ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.toolName} · ${BRAND.tagline}`,
    description: BRAND.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  // Verification block — fill in when Search Console / Bing / Yandex
  // hand you a code. Empty strings are skipped by Next.js.
  ...(GOOGLE_VERIFICATION
    ? { verification: { google: GOOGLE_VERIFICATION } }
    : {}),
};

// JSON-LD payload — Organization + Service + SoftwareApplication, all
// at once so the page has a Knowledge-Graph-worthy footprint from one
// fetch. We render via next/script with type="application/ld+json" so
// Google's crawler picks it up in the static HTML.
function buildJsonLd() {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: BRAND.agency,
    alternateName: BRAND.toolName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/infinity-logo.png`,
      width: 500,
      height: 500,
    },
    description: BRAND.description,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["Georgian", "English"],
    },
  };

  const service = {
    "@type": "Service",
    "@id": `${SITE_URL}#service`,
    name: "SEO ანალიზი და აუდიტი",
    alternateName: "SEO Analysis & Audit",
    provider: { "@id": `${SITE_URL}#organization` },
    serviceType: "SEO Audit",
    areaServed: ["Georgia", "Worldwide"],
    description:
      "ვებგვერდის ტექნიკური SEO, On-Page, Performance, Schema და AI-ეპოქის სრული აუდიტი. Free instant audit + paid SEO consultancy.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Free instant audit tool",
    },
  };

  const softwareApp = {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}#tool`,
    name: BRAND.toolName,
    applicationCategory: "WebApplication",
    operatingSystem: "Any",
    url: SITE_URL,
    description: BRAND.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    inLanguage: ["ka", "en"],
    creator: { "@id": `${SITE_URL}#organization` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, service, softwareApp],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      className={`${firaSans.variable} ${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Script
          id="ld-json-graph"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
        />
      </body>
    </html>
  );
}
