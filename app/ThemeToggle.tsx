"use client";
import { useEffect, useState } from "react";

// Light (cream) by default; choice persists. Initial value is set pre-paint by the script in layout.tsx.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  function flip() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("js_theme", next); } catch { /* private mode: still applies this visit */ }
    setDark(!dark);
  }
  return <button className="theme" onClick={flip} aria-label="Toggle dark mode">{dark ? "☀️ Light" : "🌙 Dark"}</button>;
}
