import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { FONT_FAMILY } from "./typography";

/**
 * Loads Inter + JetBrains Mono once (expo-font caches globally, so calling this
 * from every Learning screen is free after the first). Returns `true` once ready
 * OR if loading failed — text then simply renders in the system font, so the UI
 * never blocks on a font download.
 */
export function useLearningFonts(): boolean {
  const [loaded, error] = useFonts({
    [FONT_FAMILY.regular]: Inter_400Regular,
    [FONT_FAMILY.medium]: Inter_500Medium,
    [FONT_FAMILY.semibold]: Inter_600SemiBold,
    [FONT_FAMILY.bold]: Inter_700Bold,
    [FONT_FAMILY.extrabold]: Inter_800ExtraBold,
    [FONT_FAMILY.mono]: JetBrainsMono_400Regular,
    [FONT_FAMILY.monoMedium]: JetBrainsMono_500Medium,
  });
  // `error` → fall back to system fonts; treat as "settled" but report not-loaded to typography.
  return loaded && !error;
}
