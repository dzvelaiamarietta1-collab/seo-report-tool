import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Report Tool | სრული SEO ანალიზი",
  description:
    "ვებგვერდის სრული SEO აუდიტი — ტექნიკური, On-Page, Performance და AI-ეპოქის შემოწმებები ერთ ხელსაწყოში.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
