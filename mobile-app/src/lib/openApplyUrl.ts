import { Linking } from "react-native";
import { notify } from "@/lib/notify";

/** Opens a job's apply link in the device browser (never an in-app WebView; a new tab on web). */
export async function openApplyUrl(url: string) {
  try {
    if (!/^https?:\/\//i.test(url) || !(await Linking.canOpenURL(url))) throw new Error("unsupported");
    await Linking.openURL(url);
  } catch {
    notify("Couldn't open the apply link", `Please open this link in your browser:\n${url}`);
  }
}
