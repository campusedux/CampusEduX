import { Alert, Platform } from "react-native";

/**
 * Cross-platform one-shot message.
 *
 * react-native-web ships `Alert` as `class Alert { static alert() {} }` — an
 * empty stub — so every Alert.alert() call on Expo Web disappears silently.
 * On web we fall back to the browser dialog; on native we use the real Alert.
 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(text);
    } else {
      console.warn(text);
    }
    return;
  }

  Alert.alert(title, message);
}

/**
 * Same as notify(), but runs `onAcknowledge` once the user dismisses it.
 *
 * Needed wherever an Alert's OK button drives navigation: on web the button
 * array is never rendered (Alert is a stub), so the follow-up action would
 * never run and the user would be stranded on the screen.
 */
export function notifyThen(
  title: string,
  message: string | undefined,
  onAcknowledge: () => void
): void {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(text); // blocking
    } else {
      console.warn(text);
    }
    onAcknowledge();
    return;
  }

  Alert.alert(title, message, [{ text: "OK", onPress: onAcknowledge }]);
}

/**
 * Cross-platform confirm dialog. Calls `onConfirm` when the user accepts.
 *
 * On web, `Alert.alert` with a button array is a no-op, so a two-button
 * confirm would silently never fire its action — we use `window.confirm`.
 */
export function confirmAction(
  title: string,
  message: string | undefined,
  onConfirm: () => void,
  confirmLabel = "Confirm"
): void {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    const ok = typeof window !== "undefined" && typeof window.confirm === "function" ? window.confirm(text) : true;
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
