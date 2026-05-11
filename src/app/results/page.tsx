import { Suspense } from "react";
import ResultsContent from "./ResultsContent";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `ანალიზის შედეგები · ${BRAND.toolName}`,
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

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsContent />
    </Suspense>
  );
}
