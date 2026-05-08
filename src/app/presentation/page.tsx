import { Suspense } from "react";
import PresentationContent from "./PresentationContent";

export const metadata = {
  title: "SEO Report Presentation",
};

function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <p className="text-sm text-zinc-500 dark:text-zinc-500">იტვირთება...</p>
    </div>
  );
}

export default function PresentationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PresentationContent />
    </Suspense>
  );
}
