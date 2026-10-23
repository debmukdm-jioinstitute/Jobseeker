export const metadata = {
  metadataBase: new URL("https://opentowork.work"), // makes the share-image URLs absolute
  title: { default: "OpenToWork: Finance jobs, posted by the people who are hiring", template: "%s · OpenToWork" },
  applicationName: "OpenToWork",
  openGraph: { siteName: "OpenToWork", url: "https://opentowork.work" },
  description: "Finance jobs posted by founders, CFOs and team heads, with where to apply, the email, and what to send pulled out for you.",
};

// Phones and tablets: full-bleed under the notch (safe-area insets handled in CSS), no auto-zoom surprises, themed browser chrome.
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#faf6ec" } as const;
