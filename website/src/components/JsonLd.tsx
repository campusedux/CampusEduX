"use client";

import { useScriptNonce } from "@/components/analytics/ScriptNonce";

/**
 * Renders a <script type="application/ld+json"> block.
 *
 * `data` may contain admin-authored strings (grid / topic names). The
 * serialized JSON is escaped for the characters that can break out of a
 * `<script>` element in an HTML context — `<` `>` `&` and the JS line
 * separators U+2028 / U+2029. `JSON.stringify` alone does NOT escape these,
 * so without this a name like `</script><script>…` would inject markup.
 * The regex is built with `new RegExp` so this source file never contains a
 * literal U+2028/U+2029.
 */
const UNSAFE_JSONLD = new RegExp("[<>&\\u2028\\u2029]", "g");

export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(
    UNSAFE_JSONLD,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = useScriptNonce();
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // eslint-disable-next-line react/no-danger -- serialized + HTML-escaped above
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
