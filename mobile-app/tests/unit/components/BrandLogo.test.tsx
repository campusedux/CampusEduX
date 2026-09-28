import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Image, Text } from "react-native";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AuthHeader } from "@/components/ui/AuthHeader";
import { SplashScreen } from "@/auth/SplashScreen";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}

const logos = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Image).filter((i) => i.props.accessibilityLabel === "CampusEduX");

describe("BrandLogo", () => {
  it.each([
    ["mark", 80, 80],
    ["horizontal", 36, Math.round(36 * (662 / 144))],
    ["full", 230, Math.round(230 * (720 / 694))],
  ] as const)("%s keeps the logo's aspect ratio at the requested height", (variant, height, width) => {
    const r = render(<BrandLogo variant={variant} height={height} />);
    const [img] = logos(r);
    expect(img.props.style).toEqual(expect.arrayContaining([{ height, width }]));
    expect(img.props.resizeMode).toBe("contain");
    expect(img.props.accessibilityRole).toBe("image");
  });
});

describe("AuthHeader logo", () => {
  it("shows the horizontal logo above the title only when showLogo is set (Login / Register)", () => {
    const withLogo = render(<AuthHeader title="Welcome Back! 👋" showLogo />);
    expect(logos(withLogo)).toHaveLength(1);
    expect(withLogo.root.findAllByType(Text).map((t) => t.props.children)).toContain("Welcome Back! 👋");

    const without = render(<AuthHeader title="Forgot Password" />);
    expect(logos(without)).toHaveLength(0);
  });
});

describe("SplashScreen (auth-restore loading screen)", () => {
  it("shows the full logo and the loading indicator on white", () => {
    const r = render(<SplashScreen />);
    expect(logos(r)).toHaveLength(1);
    expect(r.root.findAllByType(Text).map((t) => t.props.children)).toContain("Loading...");
    expect(r.toJSON()).toMatchObject({ props: { style: { flex: 1, backgroundColor: "#FFFFFF" } } });
  });
});
