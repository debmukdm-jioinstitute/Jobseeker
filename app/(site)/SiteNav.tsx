"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { due } from "@/lib/reminders";
import { useSite } from "./SiteProvider";

const icon = (d: string) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

// Same bar on every page: section links on the landing page, Back and account links on the rest.
// On phones and small tablets the links move to a bottom tab bar, which is easier to reach with a thumb.
export default function SiteNav({ dash = false }: { dash?: boolean }) {
  const { me } = useSite();
  const path = usePathname();
  const soon = due(me.apps ?? []).length; // calls and interviews within a day
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const tabs: [string, string, string, string][] = [
    ["/", "Home", "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z", "/"],
    ["/dashboard", "Jobs", "M3 7h18v13H3zM8 7V4h8v3M3 13h18", "/dashboard"],
    ["/database", "Database", "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6", "/database"],
    ["/applications", "Applied", "M5 4h14v17l-7-4-7 4z", "/applications"],
    [me.email ? "/profile" : "/login", me.email ? "Profile" : "Sign in", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", me.email ? "/profile" : "/login"],
  ];
  return (
    <>
      <nav>
        <div className="wrap nav-in">
          <Link className="brand" href="/" aria-label="OpenToWork, back to the top"><img src="/logo.png" alt="OpenToWork" /></Link>
          {!dash && (
            <div className="nav-links">
              <Link href="/dashboard">Live jobs</Link>
              <a href="#fields" onClick={go("fields")}>Finance areas</a>
              <a href="#scanner" onClick={go("scanner")}>Check your fit</a>
              <a href="#how" onClick={go("how")}>How it works</a>
              <Link href="/database">Database</Link>
            </div>
          )}
          <div className="nav-right">
            {dash ? (
              <>
                <Link className="nav-ghost keep" href="/">← Back to site</Link>
                <Link className="nav-ghost" href="/database">Database</Link>
                <Link className="nav-ghost" href="/applications">My applications{soon > 0 && <b className="dot" aria-label={`${soon} coming up`}>{soon}</b>}</Link>
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
      <div className="tabbar" role="navigation" aria-label="Main">
        {tabs.map(([href, label, d, match]) => (
          <Link key={label} href={href} className={path === match ? "on" : ""} aria-current={path === match ? "page" : undefined}>{icon(d)}<span>{label}</span>{href === "/applications" && soon > 0 && <b className="dot" aria-label={`${soon} coming up`}>{soon}</b>}</Link>
        ))}
      </div>
    </>
  );
}
