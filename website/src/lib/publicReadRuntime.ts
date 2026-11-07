import { RevisionCache } from "@/lib/revisionCache";

// Instrumentation and route handlers can live in separate Next server bundles.
// Share only anonymous payloads and lifecycle state across those bundles.
type Runtime = {
  payloads: RevisionCache;
  revisionStarted: boolean;
  checkCount: number;
  failureCount: number;
  warmup?: Promise<void>;
};
const processGlobal = globalThis as typeof globalThis & { __campusPublicReads?: Runtime };
export const publicReadRuntime = processGlobal.__campusPublicReads ??= {
  payloads: new RevisionCache(), revisionStarted: false, checkCount: 0, failureCount: 0,
};

export function isPublicReadColdStart(): boolean {
  return process.uptime() < 60;
}
