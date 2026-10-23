import "./site.css";
import { SiteProvider } from "./SiteProvider";

export { metadata } from "../meta";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;0,1000;1,600;1,800&display=swap" />
      </head>
      <body><SiteProvider>{children}</SiteProvider></body>
    </html>
  );
}
