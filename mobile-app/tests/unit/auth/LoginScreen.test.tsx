import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TextInput } from "react-native";

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true }) }));

const mockLogin = jest.fn();
const mockResend = jest.fn();
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login: mockLogin, loginWithGoogle: jest.fn(), resendVerificationEmail: mockResend }),
}));

import { LoginScreen } from "@/auth/LoginScreen";
import { useAuthStore } from "@/store/authStore";

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(Text).map((t) => String(t.props.children));

function pressableWithText(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAllByType(Text).find((x) => x.props.children === label)!;
  let node: TestRenderer.ReactTestInstance | null = t;
  while (node && typeof node.props.onPress !== "function") node = node.parent;
  return node!;
}

const mountedRenderers: TestRenderer.ReactTestRenderer[] = [];

async function renderLogin() {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(<LoginScreen />);
  });
  mountedRenderers.push(r);
  return r;
}

async function typeAndSubmit(r: TestRenderer.ReactTestRenderer, identifier: string, password: string) {
  const [idInput, pwInput] = r.root.findAllByType(TextInput);
  await act(async () => {
    idInput.props.onChangeText(identifier);
    pwInput.props.onChangeText(password);
  });
  const loginBtn = pressableWithText(r, "Login");
  await act(async () => {
    loginBtn.props.onPress();
  });
  await flush();
}

describe("<LoginScreen /> failure handling (MOB-05)", () => {
  afterEach(() => {
    act(() => mountedRenderers.splice(0).forEach((r) => r.unmount()));
  });

  beforeEach(() => {
    mockLogin.mockReset();
    mockResend.mockReset();
    useAuthStore.setState({ isLoading: false });
  });

  it("shows a friendly inline error, keeps typed values, and never flips the global isLoading", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid login credentials"));
    const r = await renderLogin();
    await typeAndSubmit(r, "rohan@x.com", "wrongpass");

    expect(texts(r).some((t) => /Incorrect email\/mobile or password/.test(t))).toBe(true);
    const [idInput, pwInput] = r.root.findAllByType(TextInput);
    expect(idInput.props.value).toBe("rohan@x.com");
    expect(pwInput.props.value).toBe("wrongpass");
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("offers a resend action for 'Email not confirmed' and calls auth.resend", async () => {
    mockLogin.mockRejectedValue(Object.assign(new Error("Email not confirmed"), { code: "email_not_confirmed", email: "rohan@x.com" }));
    mockResend.mockResolvedValue(undefined);
    const r = await renderLogin();
    await typeAndSubmit(r, "rohan@x.com", "secret1");

    expect(texts(r)).toContain("Resend verification email");
    const resendBtn = pressableWithText(r, "Resend verification email");
    await act(async () => {
      resendBtn.props.onPress();
    });
    await flush();
    expect(mockResend).toHaveBeenCalledWith("rohan@x.com");
    expect(texts(r).some((t) => /Verification email sent/.test(t))).toBe(true);
  });
});
