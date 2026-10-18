import { getFeed } from "@/lib/sources";

export const revalidate = 21600;

export async function GET() {
  return Response.json(await getFeed());
}
