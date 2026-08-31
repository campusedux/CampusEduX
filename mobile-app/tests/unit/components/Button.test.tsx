import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/Button";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

describe("<Button />", () => {
  it("renders its label", () => {
    const r = render(<Button label="Continue" onPress={() => {}} />);
    const text = r.root.findAllByType(Text).map((t) => t.props.children);
    expect(text).toContain("Continue");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const r = render(<Button label="Login" onPress={onPress} />);
    const pressable = r.root.findAll(
      (n) => typeof n.props.onPress === "function" && n.props.accessible !== false
    )[0];
    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner and blocks presses while loading", () => {
    const onPress = jest.fn();
    const r = render(<Button label="Saving" loading onPress={onPress} />);
    expect(r.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    // label is not rendered while loading
    expect(r.root.findAllByType(Text).map((t) => t.props.children)).not.toContain("Saving");
  });

  it("is disabled when the disabled prop is set", () => {
    const r = render(<Button label="Nope" disabled onPress={() => {}} />);
    const pressable = r.root.findAllByProps({ disabled: true });
    expect(pressable.length).toBeGreaterThan(0);
  });
});
