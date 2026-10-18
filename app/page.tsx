import Link from "next/link";

export default function Landing() {
  return (
    <main>
      <nav>
        <b>Jobseeker</b>
        <Link href="/login" className="btn alt">Sign in</Link>
      </nav>
      <h1>Hiring posts, turned into actions.</h1>
      <p className="mut">
        Founders and CXOs announce roles in LinkedIn posts. Posts are collected for you automatically. See the apply form, email or job link,
        what the post asks you to do, and one-click company research. Browse by category, top-down.
      </p>
      <div className="row">
        <Link href="/login" className="btn">Create account</Link>
        <Link href="/login?guest=1" className="btn alt">Continue as guest</Link>
      </div>
      <div className="grid" style={{ marginTop: 32 }}>
        <div className="card"><h3>Pick your path</h3><p className="mut">Finance → FP&amp;A, IB, Asset Mgmt. Business, Marketing, Consulting and more.</p></div>
        <div className="card"><h3>Extract the action</h3><p className="mut">Google Forms, direct emails, careers links — pulled from the post text.</p></div>
        <div className="card"><h3>Know the company</h3><p className="mut">Leadership, funding and reviews one click away.</p></div>
      </div>
    </main>
  );
}
