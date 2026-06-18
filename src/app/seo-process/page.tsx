import { Suspense } from "react";
import type { Metadata } from "next";
import ClientPlanContent from "./ClientPlanContent";

export const metadata: Metadata = {
  title: {
    absolute: "SEO პროცესი · INFINITY",
  },
  description:
    "კლიენტისთვის გასაგები ენით აღწერილი SEO პროცესი - ეტაპები, შედეგი, ანგარიში.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-foreground-muted">
          იტვირთება…
        </div>
      }
    >
      <ClientPlanContent />
    </Suspense>
  );
}
