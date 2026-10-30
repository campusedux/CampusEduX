#!/usr/bin/env bash
set -euo pipefail

APP="${1:-website}"
case "$APP" in
  website) PORT=3100 ;;
  admin-panel) PORT=3200 ;;
  *) echo "Use: ./start-staging.sh website|admin-panel"; exit 1 ;;
esac

cd "$(dirname "$0")/$APP"

node - "$PORT" <<'JS'
const fs = require("node:fs");
const { parseEnv } = require("node:util");
const { spawnSync } = require("node:child_process");

const port = process.argv[2];
const env = {
  ...process.env,
  ...parseEnv(fs.readFileSync(".env.staging", "utf8"))
};

const expected = "https://biktjhenbvnklmagmvav.supabase.co";
if (env.NEXT_PUBLIC_SUPABASE_URL !== expected) {
  console.error("BLOCKED: Not connected to Staging");
  process.exit(1);
}

env.NEXT_PUBLIC_SITE_URL = `http://localhost:${port}`;
if (port === "3200") {
  env.NEXT_PUBLIC_WEBSITE_URL = "http://localhost:3100";
}

console.log(`STAGING ONLY: http://localhost:${port}`);
env.NODE_ENV = "development";
env.NEXT_PUBLIC_SUPABASE_URL = "https://biktjhenbvnklmagmvav.supabase.co";

const staging = parseEnv(fs.readFileSync(".env.staging", "utf8"));
if (!staging.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !["eyJ", "sb_publishable_"].some(p =>
      staging.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith(p))) {
  throw new Error("Missing staging API key");
}

// Remove inherited Supabase settings before explicitly applying staging values.
for (const name of Object.keys(env)) {
  if (name.toUpperCase().includes("SUPABASE")) delete env[name];
}
Object.assign(env, staging);
const result = spawnSync("npx", ["--no-install", "next", "dev", "-p", port], {
  env,
  stdio: "inherit"
});
process.exit(result.status ?? 1);
JS
