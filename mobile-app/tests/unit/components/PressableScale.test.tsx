import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

// PressableScale always wires onPressIn/onPressOut internally; that's the node.
const pressable = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((n) => typeof n.props.onPressIn === "function" && typeof n.props.onPressOut === "function")[0];

describe("<PressableScale />", () => {
  it("renders its children and fires onPress", () => {
    const onPress = jest.fn();
    const r = render(
      <PressableScale onPress={onPress}>
        <Text>Tap me</Text>
      </PressableScale>
    );
    expect(r.root.findAllByType(Text).map((t) => t.props.children)).toContain("Tap me");
    act(() => pressable(r).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("runs the press-in / press-out handlers without throwing and still calls the caller's", () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const r = render(
      <PressableScale onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>x</Text>
      </PressableScale>
    );
    act(() => {
      pressable(r).props.onPressIn({});
      pressable(r).props.onPressOut({});
    });
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it("does not animate-in while disabled but still forwards the event", () => {
    const onPressIn = jest.fn();
    const r = render(
      <PressableScale disabled onPressIn={onPressIn}>
        <Text>x</Text>
      </PressableScale>
    );
    act(() => pressable(r).props.onPressIn({}));
    expect(onPressIn).toHaveBeenCalledTimes(1);
  });
});
