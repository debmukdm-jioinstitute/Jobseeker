import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://opentowork.work"), // makes the share-image URLs absolute
  title: "OpenToWork — Find roles where the hiring happens",
  description: "Hiring posts from founders and hiring teams, with the apply form, the email, and the ask extracted for you.",
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("js_theme")||"light"}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
