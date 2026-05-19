import { Suspense } from "react";
import SeoOfferContent from "./SeoOfferContent";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `SEO შეთავაზება · ${BRAND.toolName}`,
};

function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent-soft border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground-muted">შეთავაზება იქმნება...</p>
      </div>
    </div>
  );
}

export default function SeoOfferPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SeoOfferContent />
    </Suspense>
  );
}
