"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import Logo from "../Logo";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setMsg(d.error ?? "Something went wrong. Try again.");
      router.push("/dashboard");
    } catch {
      setMsg("Network problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420 }}>
      <nav><Logo /><ThemeToggle /></nav>
      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
      <form className="card" onSubmit={submit}>
        <input type="email" placeholder="Email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (min 8 characters)" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}</button>{" "}
        <button type="button" className="alt" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}>
          {mode === "login" ? "Need an account?" : "Have an account?"}
        </button>
        {msg && <p className="mut">{msg}</p>}
      </form>
      <Link href="/dashboard" className="btn alt">Continue as guest</Link>
      <p className="mut small">No email verification yet, so use an email you control. Passwords cannot be reset by email.</p>
    </main>
  );
}
