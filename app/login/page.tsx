"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (new URLSearchParams(location.search).get("guest")) guest();
  }, []);

  function guest() {
    localStorage.setItem("js_guest", "1");
    router.push("/dashboard");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return setMsg("Accounts need Supabase keys (see README). Use guest for now.");
    const { error } = mode === "up" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    if (mode === "up") return setMsg("Check your email to confirm, then sign in.");
    localStorage.removeItem("js_guest");
    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 420 }}>
      <h2>{mode === "in" ? "Sign in" : "Create account"}</h2>
      <form className="card" onSubmit={submit}>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (min 6)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">{mode === "in" ? "Sign in" : "Sign up"}</button>{" "}
        <button type="button" className="alt" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Need an account?" : "Have an account?"}
        </button>
        {msg && <p className="mut">{msg}</p>}
      </form>
      <button className="alt" onClick={guest}>Continue as guest</button>
    </main>
  );
}
