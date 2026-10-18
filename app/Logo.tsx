import Link from "next/link";

// Official mark (PNG) + wordmark (PNG used as a CSS mask, so its ink colour follows light/dark theme).
export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Jobseeker home">
      <img src="/logo-mark.png" alt="" width={34} height={34} />
      <span className="wordmark" role="img" aria-label="Jobseeker" />
    </Link>
  );
}
