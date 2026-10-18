import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://jobseeker-sand.vercel.app"), // makes the share-image URLs absolute
  title: "Jobseeker",
  description: "Hiring posts, turned into actions.",
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("js_theme")||"light"}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
