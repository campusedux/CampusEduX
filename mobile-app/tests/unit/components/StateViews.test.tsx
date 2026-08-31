import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, ActivityIndicator } from "react-native";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => t.props.children);

describe("<LoadingState />", () => {
  it("shows a spinner and the default label", () => {
    const r = render(<LoadingState />);
    expect(r.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(texts(r)).toContain("Loading...");
  });

  it("shows a custom label", () => {
    const r = render(<LoadingState label="Loading wallet..." />);
    expect(texts(r)).toContain("Loading wallet...");
  });
});

describe("<ErrorState />", () => {
  it("renders the error message", () => {
    const r = render(<ErrorState message="Couldn't load your wallet." />);
    expect(texts(r)).toContain("Couldn't load your wallet.");
  });

  it("shows a retry affordance only when onRetry is provided", () => {
    const withoutRetry = render(<ErrorState message="Failed" />);
    expect(texts(withoutRetry)).not.toContain("Tap to retry");

    const onRetry = jest.fn();
    const withRetry = render(<ErrorState message="Failed" onRetry={onRetry} />);
    const retry = withRetry.root.findAllByType(Text).find((t) => t.props.children === "Tap to retry");
    expect(retry).toBeDefined();

    act(() => {
      retry!.props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("<EmptyState />", () => {
  it("renders the title and subtitle", () => {
    const r = render(<EmptyState title="No purchases yet" subtitle="Your orders will show up here." />);
    const t = texts(r);
    expect(t).toContain("No purchases yet");
    expect(t).toContain("Your orders will show up here.");
  });

  it("omits the subtitle line when none is given", () => {
    const r = render(<EmptyState title="Nothing here" />);
    expect(texts(r)).not.toContain(undefined);
    expect(texts(r)).toContain("Nothing here");
  });
});
