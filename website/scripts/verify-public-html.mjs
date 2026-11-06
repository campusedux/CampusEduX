// Run against a locally started production build; never targets a remote host.
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const origin = process.argv[2] ?? "http://127.0.0.1:3100";
const url = new URL(origin);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Local verification only");
const samples = 30;
let failures = 0;
for (const path of ["/", "/jobs", "/learning", "/blog"]) {
  const counts = { path, samples, valid200: 0, invalid200: 0, missingH1: 0, non200: 0, transportErrors: 0, initialMetadata: 0, nonceMatches: 0, statuses: {} };
  for (let attempt = 0; attempt < samples; attempt++) {
    try {
      const raw = execFileSync("curl", ["--silent", "--show-error", "--max-time", "45", "--dump-header", "-", "--user-agent", "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36", `${origin}${path}`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
      const split = raw.indexOf("\r\n\r\n");
      const headers = raw.slice(0, split);
      const html = raw.slice(split + 4);
      const status = Number(headers.match(/^HTTP\/[^ ]+ (\d+)/)?.[1]);
      counts.statuses[status] = (counts.statuses[status] ?? 0) + 1;
      if (status !== 200) {
        counts.non200++;
        failures++;
      } else {
        const head = html.split("</head>")[0];
        const metadata = /<title>[^<]+<\/title>/.test(head) && /<meta name="description" content="[^"]+"/.test(head)
          && /<link rel="canonical" href="https:\/\/www\.campusedux\.com[^"]*"/.test(head)
          && /<meta property="og:title" content="[^"]+"/.test(head)
          && /<meta property="og:description" content="[^"]+"/.test(head);
        const h1 = [...html.matchAll(/<h1\b/g)].length;
        if (h1 !== 1) counts.missingH1++;
        const nonce = headers.match(/'nonce-([^']+)'/)?.[1];
        const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
        const noncesMatch = Boolean(nonce && scripts.length && scripts.every(([, attrs]) => attrs.includes(`nonce="${nonce}"`)));
        if (metadata) counts.initialMetadata++;
        if (noncesMatch) counts.nonceMatches++;
        if (metadata && h1 === 1 && noncesMatch) counts.valid200++;
        else { counts.invalid200++; failures++; }
      }
    } catch { counts.transportErrors++; failures++; }
    await delay(500);
  }
  console.log(JSON.stringify(counts));
}
process.exitCode = failures ? 1 : 0;
