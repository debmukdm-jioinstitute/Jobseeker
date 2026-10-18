import feed from "@/data/feed.json";

// data/feed.json is refreshed every 6h by .github/workflows/collect.yml; each push redeploys the site.
export function GET() {
  return Response.json(feed.slice(0, 500));
}
