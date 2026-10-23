"use client";
import Link from "next/link";
import { useSite } from "./SiteProvider";

// Same bar on both pages: the landing page shows section links and the dashboard button; the dashboard shows Back and the account links.
export default function SiteNav({ dash = false }: { dash?: boolean }) {
  const { me } = useSite();
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  return (
    <nav>
      <div className="wrap nav-in">
        <Link className="brand" href="/" aria-label="OpenToWork, back to the top"><img src="/logo.png" alt="OpenToWork" /></Link>
        {!dash && (
          <div className="nav-links">
            <a href="#feed" onClick={go("feed")}>Live jobs</a>
            <a href="#fields" onClick={go("fields")}>Finance areas</a>
            <a href="#scanner" onClick={go("scanner")}>Check your fit</a>
            <a href="#how" onClick={go("how")}>How it works</a>
          </div>
        )}
        <div className="nav-right">
          {dash ? (
            <>
              <Link className="nav-ghost keep" href="/">← Back to site</Link>
              <Link className="nav-ghost" href="/applications">My applications</Link>
            </>
          ) : (
            !me.email && <Link className="nav-ghost" href="/login">Sign in</Link>
          )}
          {dash ? (
            <Link className="nav-cta" href={me.email ? "/profile" : "/login"}>{me.email ? "Profile" : "Sign in"}</Link>
          ) : (
            <Link className="nav-cta" href="/dashboard">Your dashboard</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
