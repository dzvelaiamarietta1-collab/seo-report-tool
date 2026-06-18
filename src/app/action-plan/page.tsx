import { Suspense } from "react";
import type { Metadata } from "next";
import ActionPlanContent from "./ActionPlanContent";

export const metadata: Metadata = {
  title: {
    // Absolute title bypasses layout template - avoids "X · INFINITY · INFINITY"
    absolute: "SEO სამოქმედო გეგმა · INFINITY",
  },
  description:
    "კვირას-კვირაობით გაწერილი SEO სამოქმედო გეგმა - 1, 3 ან 6 თვის სერვისისთვის.",
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
      <ActionPlanContent />
    </Suspense>
  );
}
