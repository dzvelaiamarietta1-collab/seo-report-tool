// Shared URL helpers — same logic that used to live inline in
// src/app/page.tsx. Both the landing hero form and the final CTA
// at the bottom of the page need these, so they sit here.

export function normalizeUrl(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

export function validateUrl(value: string): string {
  if (!value.trim()) return "გთხოვთ, შეიყვანოთ ვებგვერდის მისამართი";
  try {
    const u = new URL(normalizeUrl(value));
    if (!u.hostname.includes(".")) return "არასწორი მისამართის ფორმატი";
    return "";
  } catch {
    return "არასწორი URL";
  }
}
