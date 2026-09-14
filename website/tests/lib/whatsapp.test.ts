import { describe, it, expect, afterEach } from "vitest";
import {
  WHATSAPP_SUPPORT,
  isWhatsAppSupportEnabled,
  whatsAppSupportUrl,
} from "@/lib/whatsapp";

const EXPECTED_MESSAGE =
  "Hello CampusEduX Support Team, I need help with CampusEduX. Please assist me.";

describe("WhatsApp Support config", () => {
  it("uses the exact support number, digits only", () => {
    expect(WHATSAPP_SUPPORT.number).toBe("919370764290");
    expect(WHATSAPP_SUPPORT.number).not.toMatch(/[^\d]/); // no "+", no spaces
  });

  it("formats the display number as +91 9370764290", () => {
    expect(WHATSAPP_SUPPORT.displayNumber).toBe("+91 9370764290");
  });

  it("uses the exact pre-filled support message", () => {
    expect(WHATSAPP_SUPPORT.message).toBe(EXPECTED_MESSAGE);
  });
});

describe("whatsAppSupportUrl()", () => {
  it("builds a wa.me click-to-chat URL with the number and an encoded message", () => {
    const url = whatsAppSupportUrl();
    expect(url.startsWith("https://wa.me/919370764290?text=")).toBe(true);
    // no raw spaces or unencoded punctuation leaked into the query
    expect(url).not.toContain(" ");
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe(EXPECTED_MESSAGE); // round-trips exactly
  });

  it("encodes a custom message too", () => {
    const url = whatsAppSupportUrl("Ping & test?");
    expect(url).toContain("text=Ping%20%26%20test%3F");
    expect(new URL(url).searchParams.get("text")).toBe("Ping & test?");
  });
});

describe("isWhatsAppSupportEnabled()", () => {
  const original = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT;
    else process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT = original;
  });

  it("defaults to enabled when the var is unset", () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT;
    expect(isWhatsAppSupportEnabled()).toBe(true);
  });

  it.each(["off", "false", "0", "no", "OFF", " Off "])(
    "is disabled for %j",
    (v) => {
      process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT = v;
      expect(isWhatsAppSupportEnabled()).toBe(false);
    },
  );

  it("stays enabled for any other value", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT = "on";
    expect(isWhatsAppSupportEnabled()).toBe(true);
  });
});
