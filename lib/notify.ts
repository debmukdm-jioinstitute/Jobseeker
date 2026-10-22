import type { Opp } from "./ingest.ts";

// When a post went live on the site: the collector's first-seen time, else the post's own date.
export const liveAt = (o: Opp) => Date.parse(o.firstSeen ?? o.date) || 0;
export const newest = (feed: Opp[], n = 10) => [...feed].sort((a, b) => liveAt(b) - liveAt(a)).slice(0, n);
export const unread = (feed: Opp[], since: number) => feed.filter((o) => liveAt(o) > since).length;
