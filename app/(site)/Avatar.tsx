import { hue, initials } from "@/lib/site";

export default function Avatar({ name, cls = "avatar" }: { name: string; cls?: string }) {
  return <div className={cls} style={{ background: `hsl(${hue(name)},42%,38%)` }}>{initials(name)}</div>;
}
