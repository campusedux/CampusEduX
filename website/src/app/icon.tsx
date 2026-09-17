import { ImageResponse } from "next/og";
import { BRAND_ICON_SIZE, BrandIconMark } from "@/lib/brandIcon";

export const size = BRAND_ICON_SIZE;
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconMark />, { ...size });
}
