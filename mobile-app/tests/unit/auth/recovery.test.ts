jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@/lib/storage", () => ({ clearCachedProfile: jest.fn(() => Promise.resolve()), secureStorage: {}, STORAGE_KEYS: {} }));

const mockGetSession = jest.fn();
const mockLogout = jest.fn(() => Promise.resolve());
jest.mock("@/services/auth.service", () => ({
  authService: { getSession: () => mockGetSession(), logout: () => mockLogout() },
}));

import { abandonPasswordRecovery } from "@/auth/recovery";
import { useAuthStore } from "@/store/authStore";

beforeEach(() => {
  mockGetSession.mockReset();
  mockLogout.mockClear();
  useAuthStore.getState().reset();
});

describe("abandonPasswordRecovery", () => {
  it("clears the flag and signs out a session created during recovery", async () => {
    useAuthStore.getState().setRecoveringPassword(true);
    useAuthStore.getState().setPendingIdentifier("a@b.co");
    mockGetSession.mockResolvedValue({ user: { id: "u" } });

    await abandonPasswordRecovery();

    expect(useAuthStore.getState().isRecoveringPassword).toBe(false);
    expect(useAuthStore.getState().pendingIdentifier).toBeNull();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("clears the flag without signing out when no session was created", async () => {
    useAuthStore.getState().setRecoveringPassword(true);
    mockGetSession.mockResolvedValue(null);
    await abandonPasswordRecovery();
    expect(useAuthStore.getState().isRecoveringPassword).toBe(false);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("is a no-op after a successful reset (flag already false) so a real login is never signed out", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u" } });
    await abandonPasswordRecovery();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
