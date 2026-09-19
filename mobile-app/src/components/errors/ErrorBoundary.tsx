import React from "react";
import { Platform, View } from "react-native";
import { ErrorState } from "@/components/ui/StateViews";
import { reportError } from "@/lib/errorReporting";

interface Props {
  children?: React.ReactNode;
  /** "root" = whole-app fallback; otherwise a screen/navigator name used in reports. */
  scope?: string;
  /** Changing any value in this array clears a previous error (e.g. route key). */
  resetKeys?: readonly unknown[];
  /** Called when the user taps "Try again", before children re-render. */
  onReset?: () => void;
  /** Fully custom fallback. */
  fallback?: (args: { error: Error; reset: () => void }) => React.ReactNode;
}

interface State {
  error: Error | null;
}

function keysChanged(a: readonly unknown[] = [], b: readonly unknown[] = []) {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}

/**
 * Catches render/lifecycle errors in its subtree and shows a themed fallback
 * with "Try again" instead of white-screening the app. Reports through
 * `reportError()`. Async errors / event handlers are not caught by React
 * boundaries — those stay the caller's responsibility.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    reportError(error, { source: `ErrorBoundary:${this.props.scope ?? "screen"}`, componentStack: info?.componentStack });
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && keysChanged(prev.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children ?? null;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });

    const isRoot = this.props.scope === "root";
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#FFFFFF" }} testID="error-boundary-fallback">
        <ErrorState
          title="Something went wrong"
          message={
            isRoot
              ? "The app ran into an unexpected problem. Please try again."
              : "This screen ran into a problem. Please try again, or go back and reopen it."
          }
          onRetry={this.reset}
          retryLabel="Try again"
        />
        {isRoot && Platform.OS === "web" ? (
          <ErrorState
            message=""
            retryLabel="Reload page"
            onRetry={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
          />
        ) : null}
      </View>
    );
  }
}

/** `screenLayout` for react-navigation navigators: one boundary per screen. */
export function boundaryScreenLayout({ route, children }: { route: { key: string; name: string }; children: React.ReactElement }) {
  return (
    <ErrorBoundary scope={route.name} resetKeys={[route.key]}>
      {children}
    </ErrorBoundary>
  );
}
