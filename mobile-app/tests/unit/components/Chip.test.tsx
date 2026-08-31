import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { Chip } from "@/components/ui/Chip";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

/** The <Pressable> element (the component wrapper also carries `onPress` but no `style`). */
const pressable = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((n) => typeof n.props.onPress === "function" && !!n.props.style)[0];

describe("<Chip />", () => {
  it("renders its label", () => {
    const r = render(<Chip label="Aptitude" active={false} onPress={() => {}} />);
    expect(r.root.findByType(Text).props.children).toBe("Aptitude");
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const r = render(<Chip label="DSA" active={false} onPress={onPress} />);
    act(() => {
      pressable(r).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses the filled indigo background and white text when active", () => {
    const r = render(<Chip label="HR" active onPress={() => {}} />);
    expect(pressable(r).props.style).toEqual(expect.objectContaining({ backgroundColor: "#4F39F6" }));
    expect(r.root.findByType(Text).props.className).toContain("text-white");
  });

  it("uses a white background and grey text when inactive", () => {
    const r = render(<Chip label="HR" active={false} onPress={() => {}} />);
    expect(pressable(r).props.style).toEqual(expect.objectContaining({ backgroundColor: "#fff" }));
    expect(r.root.findByType(Text).props.className).toContain("text-gray-600");
  });
});
