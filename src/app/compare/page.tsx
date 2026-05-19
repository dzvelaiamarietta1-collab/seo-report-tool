import { Suspense } from "react";
import CompareContent from "./CompareContent";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `კონკურენტების შედარება · ${BRAND.toolName}`,
};

function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent-soft border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground-muted">იტვირთება...</p>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompareContent />
    </Suspense>
  );
}
