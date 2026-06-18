import { Suspense } from "react";
import type { Metadata } from "next";
import ProposalContent from "./ProposalContent";

export const metadata: Metadata = {
  title: {
    absolute: "SEO წინადადება · INFINITY",
  },
  description:
    "კლიენტისთვის გასაგზავნი 9-slide SEO წინადადება - 6 თვის გეგმა, სამიზნე ქივორდები, easy wins, სამოქმედო როადმეფი, ფასების პაკეტები.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-foreground-muted">იტვირთება…</div>
      }
    >
      <ProposalContent />
    </Suspense>
  );
}
