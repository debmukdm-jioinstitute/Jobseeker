import { labelOf, norm, type Entry } from "./journey.ts";

type A = { postId: string; title: string; company: string; status: string; history?: Entry[] };
export type Event = { a: A; h: Entry; at: number };

export const HOUR = 36e5;
// Calls and interviews still ahead: the latest dated entry of an application that is still at that step. Soonest first.
export function upcoming(apps: A[], now = Date.now()): Event[] {
  return apps
    .flatMap((a) => (a.history ?? []).filter((h) => h.when && norm(h.status) === norm(a.status) && Date.parse(h.when) > now).map((h) => ({ a, h, at: Date.parse(h.when!) })))
    .sort((x, y) => x.at - y.at);
}
export const due = (apps: A[], within = 24 * HOUR, now = Date.now()) => upcoming(apps, now).filter((e) => e.at - now <= within);

export function relative(at: number, now = Date.now()) {
  const m = Math.round((at - now) / 6e4);
  if (m < 60) return `in ${Math.max(1, m)} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `in ${h} h` : h < 48 ? "tomorrow" : `in ${Math.round(h / 24)} days`;
}

const stamp = (t: number) => new Date(t).toISOString().replace(/[-:]|\.\d{3}/g, "");
const esc = (s: string) => s.replace(/[\;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");
// A calendar file any phone or computer can open: it adds the event and rings a day and an hour before.
export function ics(e: Event) {
  const len = norm(e.h.status) === "interview" ? HOUR : HOUR / 2;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OpenToWork//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.a.postId}-${e.h.at}@opentowork.work`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(e.at)}`, `DTEND:${stamp(e.at + len)}`,
    `SUMMARY:${esc(`${labelOf(e.h.status)}: ${e.a.title}${e.a.company ? ` (${e.a.company})` : ""}`)}`,
    ...(e.h.note ? [`DESCRIPTION:${esc(e.h.note)}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Tomorrow", "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:In one hour", "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
