import React from "react";
import { Alert, Linking } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

const mockNavigate = jest.fn();
let mockWidth = 360;

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children ?? null }));
jest.mock("@react-native-masked-view/masked-view", () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ getParent: () => ({ navigate: mockNavigate }) }),
}));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 800, scale: 2, fontScale: 1 }),
}));

import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { WHATSAPP_CONSULTATION_MESSAGE, whatsappUrl } from "@/constants/contact";

const render = () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<CustomProjectBanner />);
  });
  return r;
};
const button = (r: TestRenderer.ReactTestRenderer, label: string) =>
  r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function")[0];

describe("CustomProjectBanner", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([360, 414, 768, 1024, 1140, 1280, 1440])("renders all content at %ipx", (w) => {
    mockWidth = w;
    const json = JSON.stringify(render().toJSON());
    expect(button(render(), "Get a Free Consultation")).toBeTruthy();
    for (const t of ["Have a Project Idea?", "Website Development", "Ongoing Support", "Get Guidance or Custom Software", "You Learn or Launch"]) {
      expect(json).toContain(t);
    }
  });

  it("Start Your Project navigates to the builder", () => {
    mockWidth = 360;
    const btn = button(render(), "Start Your Project");
    act(() => btn.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith("CustomProjects", { screen: "BuilderStart" });
  });

  it("Free Consultation opens WhatsApp with the pre-filled message", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
    const btn = button(render(), "Get a Free Consultation");
    await act(async () => btn.props.onPress());
    expect(open).toHaveBeenCalledWith(
      `https://wa.me/919370764290?text=${encodeURIComponent(WHATSAPP_CONSULTATION_MESSAGE)}`,
    );
    expect(whatsappUrl()).toBe(open.mock.calls[0][0]);
  });

  it("alerts when WhatsApp cannot be opened", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("nope"));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const btn = button(render(), "Get a Free Consultation");
    await act(async () => btn.props.onPress());
    expect(alert).toHaveBeenCalledWith("Unable to open WhatsApp", expect.any(String));
  });
});
