jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@/lib/storage", () => ({ clearCachedProfile: jest.fn(() => Promise.resolve()), secureStorage: {}, STORAGE_KEYS: {} }));

const mockAuthLogin = jest.fn();
const mockAuthLogout = jest.fn(() => Promise.resolve());
jest.mock("@/services/auth.service", () => ({
  authService: {
    login: (...a: unknown[]) => mockAuthLogin(...a),
    register: jest.fn(),
    logout: () => mockAuthLogout(),
    signInWithGoogle: jest.fn(),
    resendVerificationEmail: jest.fn(),
  },
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { queryClient } from "@/lib/queryClient";

const renderers: TestRenderer.ReactTestRenderer[] = [];

function setup() {
  const box: { v?: ReturnType<typeof useAuth> } = {};
  function Probe() {
    box.v = useAuth();
    return null;
  }
  act(() => {
    renderers.push(TestRenderer.create(<Probe />));
  });
  return box;
}

describe("useAuth", () => {
  afterEach(() => {
    act(() => renderers.splice(0).forEach((r) => r.unmount()));
  });

  beforeEach(() => {
    mockAuthLogin.mockReset();
    useAuthStore.setState({ isLoading: false });
  });

  it("login never toggles the global isLoading flag (success or failure)", async () => {
    const seen: boolean[] = [];
    const unsub = useAuthStore.subscribe((s) => seen.push(s.isLoading));
    const box = setup();

    mockAuthLogin.mockRejectedValueOnce(new Error("Invalid login credentials"));
    await act(async () => {
      await expect(box.v!.login({ identifier: "a@b.co", password: "x" })).rejects.toThrow();
    });
    mockAuthLogin.mockResolvedValueOnce({ profile: { id: "u1" } });
    await act(async () => {
      await box.v!.login({ identifier: "a@b.co", password: "x" });
    });
    unsub();
    expect(seen.every((v) => v === false)).toBe(true);
    expect(useAuthStore.getState().user).toMatchObject({ id: "u1" });
  });

  it("logout signs out then runs the shared cleanup (cache + stores)", async () => {
    queryClient.setQueryData(["wallet", "summary", "u1"], 1);
    useAuthStore.setState({ user: { id: "u1" } as never, isAuthenticated: true });
    const box = setup();
    await act(async () => {
      await box.v!.logout();
    });
    expect(mockAuthLogout).toHaveBeenCalled();
    expect(queryClient.getQueryData(["wallet", "summary", "u1"])).toBeUndefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
