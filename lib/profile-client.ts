// Browser-only. Keywords (never the resume) live on the device, and in the account when signed in.
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const put = (body: object) => fetch("/api/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});

export async function loadProfile(): Promise<{ who: string; keywords: string[] }> {
  const me = await fetch("/api/me").then((r) => r.json()).catch(() => ({ email: null }));
  const local = read<string[]>("js_keywords", []);
  if (me.email && !me.keywords?.length && local.length) put({ keywords: local }); // first sign-in adopts this device's keywords
  return { who: me.email ?? "", keywords: me.email && me.keywords?.length ? me.keywords : local };
}

export function saveKeywords(keywords: string[], signedIn: boolean) {
  localStorage.setItem("js_keywords", JSON.stringify(keywords));
  return signedIn ? put({ keywords }) : Promise.resolve();
}
