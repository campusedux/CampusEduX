import React from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { BRAND } from "@/constants/brand";

// Generated from the master logo by scripts/generate-logos.mjs (repo root).
const SOURCES = {
  /** CX mark only — small spots (About tile). Square. */
  mark: { source: require("../../../assets/brand/logo-mark.png"), ratio: 1 },
  /** Mark + wordmark + tagline — large spots (loading screen). */
  full: { source: require("../../../assets/brand/logo-full.png"), ratio: 720 / 694 },
  /** Mark + "CampusEduX" in one row — headers (Login / Register). */
  horizontal: { source: require("../../../assets/brand/logo-wordmark-horizontal.png"), ratio: 662 / 144 },
} as const;

interface BrandLogoProps {
  variant: keyof typeof SOURCES;
  /** Rendered height in dp; width follows the logo's aspect ratio. */
  height: number;
  style?: StyleProp<ImageStyle>;
}

/** The CampusEduX logo image. Never recoloured — place it on a light surface. */
export function BrandLogo({ variant, height, style }: BrandLogoProps) {
  const { source, ratio } = SOURCES[variant];
  return (
    <Image
      source={source}
      style={[{ height, width: Math.round(height * ratio) }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={BRAND.name}
    />
  );
}

export default BrandLogo;
