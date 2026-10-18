import Link from "next/link";
import data from "@/data/feed.json";
import { TAXONOMY } from "@/lib/taxonomy";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

const feed = data as { source: string }[]; // [] is typed never[] by TS
const QUICK = [["Remote", "q=remote"], ["India", "where=india"], ["Finance", "area=Finance"], ["Consulting", "area=Consulting"]];

export default function Landing() {
  return (
    <main>
      <nav>
        <Link href="/" className="logo"><i />Jobseeker</Link>
        <span className="row"><ThemeToggle /><Link href="/dashboard" className="btn alt">Browse jobs</Link><Link href="/login" className="btn">Sign in</Link></span>
      </nav>

      <div className="hero">
        <h1>Find roles where the hiring happens</h1>
        <p className="mut">Hiring posts from founders and hiring teams, gathered by our research agents. We pull out the apply form, the email, and what the post asks you to do.</p>
        <SearchBar />
        <div className="chips">{QUICK.map(([n, p]) => <Link key={n} className="chip" href={`/dashboard?${p}`}>{n}</Link>)}</div>
        {feed.length > 0 && (
          <div className="stats">
            <div><b>{feed.length.toLocaleString()}</b><span className="mut">live opportunities</span></div>
            <div><b>{new Set(feed.map((o) => o.source)).size}</b><span className="mut">sources</span></div>
            <div><b>30d</b><span className="mut">of history</span></div>
          </div>
        )}
      </div>

      <section>
        <h2>Browse by field</h2>
        <div className="tiles">
          {Object.entries(TAXONOMY).map(([c, subs]) => (
            <Link key={c} href={`/dashboard?area=${encodeURIComponent(c)}`} className="card tile">
              <b>{c}</b><div className="mut small">{subs.slice(0, 3).join(" · ")}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>How it works</h2>
        <div className="steps">
          <div className="card"><div className="num">1</div><h3>Pick your path</h3><p className="mut">Choose a field, then sub-areas like FP&amp;A, Investment Banking or Asset Management.</p></div>
          <div className="card"><div className="num">2</div><h3>See the action</h3><p className="mut">Every card shows how to apply: form, email or job page, plus the post’s instructions.</p></div>
          <div className="card"><div className="num">3</div><h3>Know the company</h3><p className="mut">Open a card for one-click research on leadership, funding and reviews. Save roles for later.</p></div>
        </div>
      </section>
    </main>
  );
}
