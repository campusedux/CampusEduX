import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TextInput } from "react-native";
import { Input } from "@/components/ui/Input";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

describe("<Input />", () => {
  it("passes through TextInput props like placeholder and value", () => {
    const r = render(<Input placeholder="Email" value="rohan@x.com" onChangeText={() => {}} />);
    const field = r.root.findByType(TextInput);
    expect(field.props.placeholder).toBe("Email");
    expect(field.props.value).toBe("rohan@x.com");
  });

  it("renders the error message when one is provided", () => {
    const r = render(<Input error="Required field" />);
    expect(r.root.findAllByType(Text).map((t) => t.props.children)).toContain("Required field");
  });

  it("does not render an error line by default", () => {
    const r = render(<Input placeholder="Name" />);
    // only the (absent) error <Text> would appear; nothing else uses <Text> here
    expect(r.root.findAllByType(Text)).toHaveLength(0);
  });

  it("starts masked and toggles secure entry when the eye icon is pressed", () => {
    const r = render(<Input isPassword placeholder="Password" />);
    const field = r.root.findByType(TextInput);
    expect(field.props.secureTextEntry).toBe(true);

    const eye = r.root.findAllByType(Text).find((t) => String(t.props.children).includes("eye"));
    act(() => {
      eye!.props.onPress();
    });

    expect(r.root.findByType(TextInput).props.secureTextEntry).toBe(false);
  });
});
