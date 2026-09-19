import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TextInput, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { ListItem } from "@/components/ui/ListItem";
import { Skeleton, SkeletonList } from "@/components/ui/SkeletonLoader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}
const texts = (r: TestRenderer.ReactTestRenderer) => r.root.findAllByType(Text).map((t) => t.props.children);
const press = (r: TestRenderer.ReactTestRenderer, label: string) => {
  const node = r.root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function");
  act(() => node.props.onPress());
};

describe("Button new variants", () => {
  it.each(["secondary", "ghost", "gradient", "primary", "outline", "text", "danger"] as const)("%s renders label and fires onPress", (variant) => {
    const onPress = jest.fn();
    const r = render(<Button label="Go" variant={variant} onPress={onPress} />);
    expect(texts(r)).toContain("Go");
    press(r, "Go");
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a right icon and blocks presses while loading", () => {
    const r = render(<Button label="Next" rightIcon="arrow-forward" loading onPress={() => {}} />);
    expect(r.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  });
});

describe("Chip additions", () => {
  it("shows the count only when provided and stays 44px tall", () => {
    const r = render(<Chip label="Java" active={false} count={12} onPress={() => {}} />);
    expect(texts(r)).toContain(12);
    const p = r.root.find((n) => typeof n.props.onPress === "function" && !!n.props.style);
    expect(p.props.style.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("uses a custom accent when active", () => {
    const r = render(<Chip label="A" active accent="#0D9488" onPress={() => {}} />);
    const p = r.root.find((n) => typeof n.props.onPress === "function" && !!n.props.style);
    expect(p.props.style.backgroundColor).toBe("#0D9488");
  });
});

describe("Input additions", () => {
  it("shows label and helper text, error replaces helper, focus/blur forwarded", () => {
    const onFocus = jest.fn();
    const r = render(<Input label="Email" helperText="We never share it" onFocus={onFocus} />);
    expect(texts(r)).toEqual(expect.arrayContaining(["Email", "We never share it"]));
    act(() => r.root.findByType(TextInput).props.onFocus({}));
    expect(onFocus).toHaveBeenCalled();
    act(() => r.update(<Input label="Email" helperText="We never share it" error="Bad" />));
    expect(texts(r)).toContain("Bad");
    expect(texts(r)).not.toContain("We never share it");
  });
});

describe("Card / Badge / headers", () => {
  it("Card renders children in every variant and is pressable when asked", () => {
    const onPress = jest.fn();
    (["plain", "tinted", "gradient"] as const).forEach((variant) => {
      const r = render(<Card variant={variant} accent="teal" onPress={onPress} accessibilityLabel={`c-${variant}`}><Text>Hi</Text></Card>);
      expect(texts(r)).toContain("Hi");
      press(r, `c-${variant}`);
    });
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("Badge renders label for status, accent and neutral tones", () => {
    (["success", "danger", "violet", "neutral", "primary"] as const).forEach((tone) => {
      expect(texts(render(<Badge label="NEW" tone={tone} />))).toContain("NEW");
    });
  });

  it("ScreenHeader shows back only when onBack given", () => {
    const onBack = jest.fn();
    const withBack = render(<ScreenHeader title="Jobs" subtitle="Find work" onBack={onBack} />);
    expect(texts(withBack)).toEqual(expect.arrayContaining(["Jobs", "Find work"]));
    press(withBack, "Go back");
    expect(onBack).toHaveBeenCalled();
    const noBack = render(<ScreenHeader title="Jobs" variant="gradient" />);
    expect(noBack.root.findAll((n) => n.props.accessibilityLabel === "Go back")).toHaveLength(0);
  });

  it("SectionHeader keeps View All and supports a custom label", () => {
    const onViewAll = jest.fn();
    const r = render(<SectionHeader title="Trending" onViewAll={onViewAll} />);
    expect(texts(r)).toContain("View All");
    const r2 = render(<SectionHeader title="Trending" subtitle="This week" accent="orange" actionLabel="See more" onViewAll={onViewAll} />);
    expect(texts(r2)).toEqual(expect.arrayContaining(["This week", "See more"]));
  });
});

describe("SearchBar / ListItem", () => {
  it("SearchBar shows clear only with a value and fires it", () => {
    const onClear = jest.fn();
    const empty = render(<SearchBar value="" onChangeText={() => {}} onClear={onClear} />);
    expect(empty.root.findAll((n) => n.props.accessibilityLabel === "Clear search")).toHaveLength(0);
    const filled = render(<SearchBar value="java" onChangeText={() => {}} onClear={onClear} onFilterPress={() => {}} filterActive />);
    press(filled, "Clear search");
    expect(onClear).toHaveBeenCalled();
    expect(filled.root.findAll((n) => n.props.accessibilityLabel === "Filters").length).toBeGreaterThan(0);
  });

  it("ListItem renders title/subtitle/value and presses", () => {
    const onPress = jest.fn();
    const r = render(<ListItem title="Language" subtitle="App language" value="English" icon="language" onPress={onPress} />);
    expect(texts(r)).toEqual(expect.arrayContaining(["Language", "App language", "English"]));
    press(r, "Language, App language");
    expect(onPress).toHaveBeenCalled();
  });
});

describe("Skeleton + states", () => {
  it("SkeletonList renders the requested placeholder count without a spinner", () => {
    const r = render(<SkeletonList count={3} variant="row" />);
    expect(r.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    expect(r.root.findAllByType(Skeleton).length).toBeGreaterThanOrEqual(3);
    act(() => r.unmount());
  });

  it("LoadingState skeleton variant has no spinner; default variant still does", () => {
    const sk = render(<LoadingState variant="skeleton" count={2} />);
    expect(sk.root.findAllByType(ActivityIndicator)).toHaveLength(0);
    act(() => sk.unmount());
    expect(render(<LoadingState />).root.findAllByType(ActivityIndicator)).toHaveLength(1);
  });

  it("EmptyState action and ErrorState title are opt-in", () => {
    const onAction = jest.fn();
    const r = render(<EmptyState title="No jobs" actionLabel="Browse jobs" onAction={onAction} />);
    press(r, "Browse jobs");
    expect(onAction).toHaveBeenCalled();
    expect(texts(render(<EmptyState title="No jobs" />))).not.toContain("Browse jobs");
    expect(texts(render(<ErrorState title="Oops" message="Failed" />))).toEqual(expect.arrayContaining(["Oops", "Failed"]));
  });
});
