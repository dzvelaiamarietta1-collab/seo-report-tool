// Brand identifiers used across the app.
//
// Two separate fields because the tool itself and the agency that
// delivers the audit are different things:
//   - toolName: shown in the web UI (landing page, browser tab title) -
//     this is the descriptive name of the tool itself.
//   - agency:   shown in client-facing deliverables (PPTX footer, /presentation
//     cover and footer) - this is the consultancy brand that signs the work.
export const BRAND = {
  toolName: "INFINITY",
  tagline: "ვებგვერდის SEO ანალიზი",
  description:
    "ტექნიკური, On-Page, Performance და AI-ეპოქის სრული აუდიტი - ერთი ხელსაწყოთი.",
  agency: "INFINITY SOLUTIONS",
} as const;
