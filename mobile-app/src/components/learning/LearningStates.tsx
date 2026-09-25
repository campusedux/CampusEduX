import React from "react";
import { Text, View } from "react-native";
import { LAYOUT, RADII, SPACE, TOUCH, useTheme } from "@/theme";
import { PressableScale } from "@/components/ui/PressableScale";
import { BackButton } from "./BackButton";
import { PageContainer } from "./LearningScreen";

/** Friendly empty / error block (emoji + message + optional action). Themed for light + dark. */
export function StateBlock({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
  compact,
}: {
  emoji: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "error";
  /** Less vertical padding, for states shown inside an already-populated screen. */
  compact?: boolean;
}) {
  const { colors, type } = useTheme();
  const bubble = tone === "error" ? colors.dangerSoft : colors.primarySoft;
  return (
    <View accessibilityRole={tone === "error" ? "alert" : undefined} style={{ alignItems: "center", paddingVertical: compact ? SPACE[6] : SPACE[12], paddingHorizontal: SPACE[6] }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: bubble, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>
      <Text style={[type.h3, { color: colors.text, textAlign: "center", marginTop: SPACE[4] }]}>{title}</Text>
      {message ? (
        <Text style={[type.small, { color: colors.textSecondary, textAlign: "center", marginTop: SPACE[1], maxWidth: 360 }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          accessibilityLabel={actionLabel}
          style={{
            marginTop: SPACE[5],
            minHeight: TOUCH.min,
            paddingHorizontal: SPACE[6],
            borderRadius: RADII.md,
            backgroundColor: colors.primaryFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[type.button, { color: colors.textOnPrimary }]}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/**
 * The ONE error state for the Learning section: same emoji, tone, copy pattern and Retry button everywhere.
 * `what` completes "Couldn't load …"; pass `title` to override the whole heading.
 */
export function ErrorBlock({ what, title, message = "Check your connection and try again.", onRetry, compact }: { what?: string; title?: string; message?: string; onRetry?: () => void; compact?: boolean }) {
  return (
    <StateBlock
      tone="error"
      emoji="😕"
      title={title ?? `Couldn't load ${what ?? "this"}`}
      message={message}
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
      compact={compact}
    />
  );
}

/** The ONE empty state (nothing to show / nothing found / not available). */
export function EmptyBlock(props: { emoji: string; title: string; message?: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  return <StateBlock tone="neutral" {...props} />;
}

/**
 * Frame for screens whose main content isn't available yet (loading / error / not found): the same back button + title
 * row every Learning detail screen uses, with the state beneath it.
 */
export function StateFrame({ onBack, title, children, maxWidth = LAYOUT.listMaxWidth }: { onBack: () => void; title?: string; children: React.ReactNode; maxWidth?: number }) {
  const { colors, type } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <PageContainer maxWidth={maxWidth} style={{ paddingTop: SPACE[2], paddingBottom: SPACE[3], flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
        <BackButton onPress={onBack} />
        {title ? (
          <Text numberOfLines={1} style={[type.title, { color: colors.text, flex: 1 }]}>
            {title}
          </Text>
        ) : null}
      </PageContainer>
      {children}
    </View>
  );
}
