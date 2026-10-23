// The life of one application, from saved to selected. Users move it along by hand and can add a date and a note at every step.
export const JOURNEY = [
  { key: "applied", label: "Applied", date: false },
  { key: "received", label: "Update received", date: false },
  { key: "hr_call", label: "HR call scheduled", date: true },
  { key: "interview", label: "Interview scheduled", date: true },
  { key: "selected", label: "Selected", date: false },
] as const;
export const ORDER = ["opened", ...JOURNEY.map((j) => j.key)]; // "opened" = saved, or email opened but not confirmed
export const ALL = [...ORDER, "rejected"];
const LEGACY: Record<string, string> = { replied: "received", offer: "selected" }; // names used before the portal existed
export const norm = (s: string) => LEGACY[s] ?? s;
export const labelOf = (s: string) => (s === "opened" ? "Saved" : s === "rejected" ? "Not selected" : JOURNEY.find((j) => j.key === norm(s))?.label ?? s);

export type Entry = { status: string; at: string; note?: string; when?: string };

// Position on the path. "Not selected" keeps the furthest step the application reached.
export function stageOf(status: string, history: Entry[] = []) {
  const s = norm(status);
  if (s !== "rejected") return Math.max(0, ORDER.indexOf(s));
  return Math.max(1, ...history.map((h) => ORDER.indexOf(norm(h.status))));
}
