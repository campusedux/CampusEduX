import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLd from "@/components/JsonLd";
import { ScriptNonceProvider } from "@/components/analytics/ScriptNonce";
import { tagWithAttributes } from "../helpers/html";

describe("ScriptNonceProvider server/client boundary", () => {
  it("exports a function component for the server layout to reference", () => {
    expect(ScriptNonceProvider).toBeTypeOf("function");
  });

  it("passes a plain nonce string to nested JSON-LD scripts and preserves children", () => {
    const html = renderToStaticMarkup(
      <ScriptNonceProvider nonce="document-nonce">
        <main>Page content</main>
        <JsonLd data={{ "@type": "Organization", name: "CampusEduX" }} />
      </ScriptNonceProvider>,
    );

    expect(html).toContain("<main>Page content</main>");
    expect(html).toMatch(tagWithAttributes("script", {
      type: "application/ld+json",
      nonce: "document-nonce",
    }));
    expect(html).toContain('"name":"CampusEduX"');
  });

  it("omits script nonces when nonce mode is disabled", () => {
    const html = renderToStaticMarkup(
      <ScriptNonceProvider nonce={undefined}>
        <JsonLd data={{ "@type": "Organization" }} />
      </ScriptNonceProvider>,
    );

    expect(html).toContain('type="application/ld+json"');
    expect(html).not.toContain("nonce=");
  });
});
