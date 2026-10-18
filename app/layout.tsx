import "./globals.css";

export const metadata = { title: "Jobseeker", description: "Hiring posts, turned into actions." };

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
