import { Linking, Platform } from "react-native";
import { notify } from "@/lib/notify";

/**
 * Normalises a user/admin-entered link to an http(s) URL. Bare hosts
 * ("www.acme.com") get `https://`; any other scheme (javascript:, data:,
 * intent:, ...) and empty input yield null.
 */
export function toHttpUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^/?#:]+\.[^/?#:]+:\d+/.test(value)) return null; // some other scheme
  if (/\s/.test(value)) return null;
  return `https://${value.replace(/^\/+/, "")}`;
}

/** Opens a normalised http(s) link; never throws. Returns false when it couldn't. */
export async function openHttpUrl(raw: string | null | undefined): Promise<boolean> {
  const url = toHttpUrl(raw);
  if (!url) return false;
  try {
    if (Platform.OS !== "web" && !(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Opens a job's apply link in the device browser (never an in-app WebView; a new tab on web). */
export async function openApplyUrl(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) throw new Error("unsupported");
    if (Platform.OS === "web") {
      // Must run synchronously inside the click handler: awaiting anything
      // first (canOpenURL) lets browsers drop the user gesture and block the popup.
      await Linking.openURL(url);
      return;
    }
    if (!(await Linking.canOpenURL(url))) throw new Error("unsupported");
    await Linking.openURL(url);
  } catch {
    notify("Couldn't open the apply link", `Please open this link in your browser:\n${url}`);
  }
}
