import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ErrorBoundary, boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import { setErrorReporter } from "@/lib/errorReporting";

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error("kaboom");
  return <Text>all good</Text>;
}

const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(Text).map((t) => t.props.children);

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}

describe("<ErrorBoundary />", () => {
  const reporter = jest.fn();
  beforeEach(() => {
    shouldThrow = true;
    reporter.mockClear();
    setErrorReporter(reporter);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    setErrorReporter(null);
    jest.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    shouldThrow = false;
    const r = render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(texts(r)).toContain("all good");
  });

  it("shows the fallback and reports through reportError when a child throws", () => {
    const r = render(<ErrorBoundary scope="Jobs"><Bomb /></ErrorBoundary>);
    expect(texts(r)).toContain("Something went wrong");
    expect(texts(r)).toContain("Try again");
    expect(reporter).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ source: "ErrorBoundary:Jobs" }));
  });

  it("'Try again' resets and re-renders the children (and calls onReset)", () => {
    const onReset = jest.fn();
    const r = render(<ErrorBoundary onReset={onReset}><Bomb /></ErrorBoundary>);
    shouldThrow = false;
    const retry = r.root.findAllByType(Text).find((t) => t.props.children === "Try again")!;
    act(() => retry.props.onPress());
    expect(onReset).toHaveBeenCalled();
    expect(texts(r)).toContain("all good");
  });

  it("clears the error when resetKeys change", () => {
    const r = render(<ErrorBoundary resetKeys={["a"]}><Bomb /></ErrorBoundary>);
    shouldThrow = false;
    act(() => r.update(<ErrorBoundary resetKeys={["b"]}><Bomb /></ErrorBoundary>));
    expect(texts(r)).toContain("all good");
  });

  it("boundaryScreenLayout isolates a crashing screen", () => {
    const r = render(boundaryScreenLayout({ route: { key: "k1", name: "Broken" }, children: <Bomb /> }));
    expect(texts(r)).toContain("Something went wrong");
  });
});
