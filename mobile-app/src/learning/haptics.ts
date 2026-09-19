import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/** Light tick for toggles (bookmark). No-op on web / unsupported devices; never throws. */
export function selectionHaptic(): void {
  if (Platform.OS === "web") return;
  Haptics.selectionAsync().catch(() => undefined);
}

/** Success buzz (mark complete). */
export function successHaptic(): void {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
