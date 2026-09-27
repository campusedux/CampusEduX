import Constants from "expo-constants";

/** "1.2.3" -> [1, 2, 3]; anything else -> null (callers fail open). */
export function parseVersion(v: string | null | undefined): [number, number, number] | null {
  const m = /^\s*(\d{1,4})\.(\d{1,4})\.(\d{1,4})\s*$/.exec(v ?? "");
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** -1 / 0 / 1, or null when either side is not x.y.z. */
export function compareVersions(a: string | null | undefined, b: string | null | undefined): -1 | 0 | 1 | null {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/**
 * True only when BOTH versions are valid and the installed one is strictly lower. A missing/unreadable
 * minimum (network error, column not migrated yet) never blocks anyone.
 */
export function isUpdateRequired(current: string | null | undefined, minimum: string | null | undefined): boolean {
  return compareVersions(current, minimum) === -1;
}

/** The installed app's version — app.json "version", embedded in every build. */
export function currentAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}
