// Single source of truth for product name + tagline. All UI/PPTX/metadata
// references read from here so renaming is one edit, not a project-wide
// search-and-replace.
export const BRAND = {
  name: "Audita",
  tagline: "ვებგვერდის SEO ანალიზი",
  description:
    "ტექნიკური, On-Page, Performance და AI-ეპოქის სრული აუდიტი — ერთი ხელსაწყოთი.",
  author: "Audita",
} as const;
