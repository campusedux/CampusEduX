import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";

const BANNER = require("../../assets/images/custom-project-banner.png");

// Matches the source artwork's exact pixel aspect ratio (2056×765) — also
// used by `website/src/components/CustomProjectBanner.tsx` — so the image
// scales without ever being cropped or distorted.
const ASPECT_RATIO = 2056 / 765;

/**
 * Overlay positions are percentages measured directly from the source
 * artwork's "Start Your Project" / "Get a Free Consultation" buttons. Because
 * the container is locked to the image's exact aspect ratio, these stay
 * pixel-accurate at any rendered width.
 */
const CTA = {
  start: { left: "4.33%", top: "63.27%", width: "17.25%", height: "11.24%" },
  learnMore: { left: "23.35%", top: "63.27%", width: "15.76%", height: "11.24%" },
} as const;

/**
 * "Custom Project Development" promo — shared by the Home dashboard (above
 * Categories) and the All Projects screen (top of the marketplace). One
 * component, one artwork, reused in both places rather than duplicated or
 * redesigned. Mirrors `website/src/components/CustomProjectBanner.tsx`: the
 * banner IS the shared image asset, with two transparent, accessible tap
 * targets over the buttons baked into it.
 */
export function CustomProjectBanner({
  onStartProject,
  onLearnMore,
}: {
  onStartProject: () => void;
  onLearnMore: () => void;
}) {
  return (
    <View className="mb-4 w-full" style={{ aspectRatio: ASPECT_RATIO }}>
      <Image
        source={BANNER}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        accessible
        accessibilityLabel="Custom Project Development. Have a project idea? We'll build it for you. Website, mobile app, web app, final year project, or custom software — share your idea and our team turns it into a complete, working project."
      />
      <Pressable
        onPress={onStartProject}
        accessibilityRole="button"
        accessibilityLabel="Start your project"
        style={{ position: "absolute", ...CTA.start }}
      />
      <Pressable
        onPress={onLearnMore}
        accessibilityRole="button"
        accessibilityLabel="Get a free consultation"
        style={{ position: "absolute", ...CTA.learnMore }}
      />
    </View>
  );
}

export default CustomProjectBanner;
