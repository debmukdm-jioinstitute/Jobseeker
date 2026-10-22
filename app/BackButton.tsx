"use client";
import { useRouter } from "next/navigation";

// Goes to the previous page; if the tab has no history (opened from a link), falls back to the home page.
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const r = useRouter();
  return <button className="btn alt" onClick={() => (history.length > 1 ? r.back() : r.push(fallback))}>← Back</button>;
}
