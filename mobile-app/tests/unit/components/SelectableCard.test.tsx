import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { SelectableCard } from "@/components/ui/SelectableCard";

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

const labels = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => t.props.children);

describe("<SelectableCard />", () => {
  it("renders the label and calls onPress", () => {
    const onPress = jest.fn();
    const r = render(<SelectableCard icon="school-outline" label="B.Tech" selected={false} onPress={onPress} />);

    expect(labels(r)).toContain("B.Tech");
    act(() => {
      pressable(r).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows the check badge and indigo styling only when selected", () => {
    const unselected = render(<SelectableCard icon="school-outline" label="BCA" selected={false} onPress={() => {}} />);
    expect(labels(unselected)).not.toContain("checkmark");
    expect(pressable(unselected).props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFFFFF", borderWidth: 1 })
    );

    const selected = render(<SelectableCard icon="school-outline" label="BCA" selected onPress={() => {}} />);
    expect(labels(selected)).toContain("checkmark");
    expect(pressable(selected).props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#EEF0FF", borderWidth: 2 })
    );
  });

  it("applies a custom height", () => {
    const r = render(<SelectableCard icon="calendar-outline" label="2025" selected={false} onPress={() => {}} height={90} />);
    expect(pressable(r).props.style).toEqual(expect.objectContaining({ height: 90 }));
  });
});
