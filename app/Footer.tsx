import Link from "next/link";

// Brand panel at the foot of every app page.
export default function Footer() {
  return (
    <footer className="otw-foot">
      <img src="/logo-white.png" alt="OpenToWork" height={34} />
      <span className="otw-vr" aria-hidden="true" />
      <div className="otw-tag">
        <b>Roles where the hiring happens.</b>
        <small>OPENTOWORK.WORK · FOUNDER POSTS · EMAILS · FORMS, EXTRACTED FOR YOU</small>
      </div>
      <Link href="/dashboard" className="btn">Browse jobs →</Link>
    </footer>
  );
}
