import type { LucideIcon } from "lucide-react";
import {
  Folder,
  Code2,
  Smartphone,
  Globe,
  Database,
  Brain,
  Cpu,
  LineChart,
  Cloud,
  Gamepad2,
  ShieldCheck,
  Boxes,
  Palette,
} from "lucide-react";

/** True when `now` is inside an optional [starts_at, ends_at] window. */
export function inWindow(startsAt: string | null, endsAt: string | null, now = Date.now()): boolean {
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() < now) return false;
  return true;
}

/** A colourful tile visual for a category — mirrors the app's Home grid. */
const TILE_TINTS: { tint: string; bg: string }[] = [
  { tint: "#4F39F6", bg: "#EEF0FF" },
  { tint: "#0EA5E9", bg: "#E0F2FE" },
  { tint: "#16A34A", bg: "#DCFCE7" },
  { tint: "#DB2777", bg: "#FCE7F3" },
  { tint: "#7C3AED", bg: "#EDE9FE" },
  { tint: "#0D9488", bg: "#CCFBF1" },
  { tint: "#EA580C", bg: "#FFEDD5" },
  { tint: "#2563EB", bg: "#DBEAFE" },
];

/** Maps the DB `icon` string (ionicon-ish) or the category name to a lucide icon. */
export function categoryIcon(iconOrName: string | null | undefined): LucideIcon {
  const s = (iconOrName ?? "").toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => s.includes(k));
  if (has("mobile", "phone", "android", "ios", "app")) return Smartphone;
  if (has("web", "globe", "browser", "html")) return Globe;
  if (has("data", "database", "sql", "analytics", "ml", "ai", "machine")) return has("ai", "ml", "machine") ? Brain : Database;
  if (has("cloud", "devops", "aws")) return Cloud;
  if (has("game")) return Gamepad2;
  if (has("security", "cyber", "shield")) return ShieldCheck;
  if (has("iot", "embedded", "hardware", "chip", "cpu")) return Cpu;
  if (has("chart", "finance", "trading", "business")) return LineChart;
  if (has("design", "ui", "ux", "figma", "palette")) return Palette;
  if (has("code", "software", "program", "dev")) return Code2;
  if (has("block", "cube", "box")) return Boxes;
  return Folder;
}

export function categoryVisual(index: number): { tint: string; bg: string } {
  return TILE_TINTS[index % TILE_TINTS.length];
}
