jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { legalService } from "@/services/legal.service";
import { CURRENT_LEGAL_VERSION } from "@/constants/legal";
import {
  resetSupabaseMock,
  setTableResult,
  setRpcResult,
  supabase,
} from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

describe("legalService.recordConsent", () => {
  it("calls record_legal_consent with the current version strings", async () => {
    setRpcResult("record_legal_consent", { data: { id: "c-1" } });

    await legalService.recordConsent("register");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "record_legal_consent",
      expect.objectContaining({
        p_legal_version: CURRENT_LEGAL_VERSION,
        p_source: "register",
      }),
    );
  });

  it("throws when the RPC returns an error", async () => {
    setRpcResult("record_legal_consent", { error: { message: "not signed in" } });
    await expect(legalService.recordConsent()).rejects.toThrow("not signed in");
  });
});

describe("legalService.hasCurrentConsent", () => {
  it("is true when the latest row matches the current version", async () => {
    setTableResult("legal_consents", { data: { legal_version: CURRENT_LEGAL_VERSION } });
    expect(await legalService.hasCurrentConsent()).toBe(true);
  });

  it("is false when there is no row or the version is stale", async () => {
    setTableResult("legal_consents", { data: null });
    expect(await legalService.hasCurrentConsent()).toBe(false);

    setTableResult("legal_consents", { data: { legal_version: "1900.01.01" } });
    expect(await legalService.hasCurrentConsent()).toBe(false);
  });
});

describe("legalService.ensureConsentRecorded", () => {
  it("does not write when consent for the current version already exists", async () => {
    setTableResult("legal_consents", { data: { legal_version: CURRENT_LEGAL_VERSION } });

    await legalService.ensureConsentRecorded();

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("writes a consent record when none exists yet", async () => {
    setTableResult("legal_consents", { data: null });
    setRpcResult("record_legal_consent", { data: { id: "c-2" } });

    await legalService.ensureConsentRecorded();

    expect(supabase.rpc).toHaveBeenCalledWith("record_legal_consent", expect.any(Object));
  });

  it("never throws, even if the check fails", async () => {
    setTableResult("legal_consents", { error: { message: "rls" } });
    await expect(legalService.ensureConsentRecorded()).resolves.toBeUndefined();
  });
});
