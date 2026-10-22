import "./globals.css";
import "./theme.css";

export const metadata = {
  metadataBase: new URL("https://opentowork.work"), // makes the share-image URLs absolute
  title: { default: "OpenToWork — Roles where the hiring happens", template: "%s · OpenToWork" },
  applicationName: "OpenToWork",
  openGraph: { siteName: "OpenToWork", url: "https://opentowork.work" },
  description: "Hiring posts from founders and hiring teams, with the apply form, the email, and the ask extracted for you.",
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("js_theme")||"light"}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Figtree:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
