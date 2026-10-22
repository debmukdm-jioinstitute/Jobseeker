import Link from "next/link";

// Official logo. Two files, swapped by theme in theme.css: dark ink for light pages, white ink for dark.
export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="OpenToWork home">
      <img className="logo-light" src="/logo.png" alt="OpenToWork" height={34} />
      <img className="logo-dark" src="/logo-white.png" alt="" height={34} />
    </Link>
  );
}
