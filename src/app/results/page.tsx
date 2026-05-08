import { Suspense } from "react";
import ResultsContent from "./ResultsContent";

export const metadata = {
  title: "ანალიზის შედეგები · SEO Report Tool",
};

function LoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">იტვირთება...</p>
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
