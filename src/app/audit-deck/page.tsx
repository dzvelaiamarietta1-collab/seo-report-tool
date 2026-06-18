import { Suspense } from "react";
import type { Metadata } from "next";
import AuditDeckContent from "./AuditDeckContent";

export const metadata: Metadata = {
  title: {
    absolute: "SEO აუდიტი - 19 სლაიდი - INFINITY",
  },
  description:
    "კლიენტისთვის გასაგზავნი 19-სლაიდიანი SEO აუდიტი - ტექნიკური, On-page, კონკურენტული ანალიზი, 6-თვიანი მიზნები.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-foreground-muted">იტვირთება...</div>
      }
    >
      <AuditDeckContent />
    </Suspense>
  );
}
