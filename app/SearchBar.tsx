"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// On the landing page (no onSearch) it navigates to the dashboard with the query in the URL.
export default function SearchBar({ q = "", where = "", onSearch }: { q?: string; where?: string; onSearch?: (q: string, where: string) => void }) {
  const router = useRouter();
  const [a, setA] = useState(q);
  const [b, setB] = useState(where);
  return (
    <form className="search" onSubmit={(e) => { e.preventDefault(); onSearch ? onSearch(a, b) : router.push(`/dashboard?${new URLSearchParams({ q: a, where: b })}`); }}>
      <input aria-label="Skills, designations or companies" placeholder="Skills, designations, companies" value={a} onChange={(e) => setA(e.target.value)} />
      <input aria-label="Location" placeholder="Location (try India)" value={b} onChange={(e) => setB(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  );
}
