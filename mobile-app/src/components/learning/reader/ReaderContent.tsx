import React from "react";
import { Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { notify } from "@/lib/notify";
import { RADII, SPACE, fontFamily, useTheme } from "@/theme";
import { nodeGap, type PreparedBlock, type ReaderNode } from "@/learning/reader/readerModel";
import type { ListItem, QnAParts } from "@/learning/reader/markdownParser";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { InlineText } from "./InlineText";
import { StyledTable } from "./StyledTable";
import { useReaderCtx } from "./readerContext";

function HeadingBlock({ id, level, text, inline }: { id: string; level: number; text: string; inline: import("@/learning/reader/markdownParser").Inline[] }) {
  const { colors, type } = useTheme();
  const { accent, anchors } = useReaderCtx();
  // Source levels: 1–2 → section (H2 look), 3 → H3, 4+ → H4
  const style = level <= 2 ? type.h2 : level === 3 ? type.h3 : type.h4;
  const numbered = level <= 2 ? text.match(/^(\d+)[.)]\s+(.*)$/) : null;

  let body: React.ReactNode;
  if (numbered) {
    // "1. Why Do We Need…" → coloured number badge + title
    const rest = inline.map((n, i) => (i === 0 && n.t === "text" ? { ...n, v: n.v.replace(/^\s*\d+[.)]\s+/, "") } : n));
    body = (
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACE[3] }}>
        <View
          style={{
            minWidth: 30,
            height: 30,
            paddingHorizontal: 6,
            marginTop: Math.max(0, ((style.lineHeight ?? 30) - 30) / 2),
            borderRadius: RADII.sm,
            backgroundColor: accent.gradient[1],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[type.label, { color: "#FFFFFF", fontFamily: type.title.fontFamily }]}>{numbered[1]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <InlineText nodes={rest} style={[style, { color: colors.text }]} />
        </View>
      </View>
    );
  } else if (level <= 2) {
    // un-numbered section → left accent bar
    body = (
      <View style={{ borderLeftWidth: 4, borderLeftColor: accent.base, paddingLeft: SPACE[3], borderRadius: 2 }}>
        <InlineText nodes={inline} style={[style, { color: colors.text }]} />
      </View>
    );
  } else {
    body = <InlineText nodes={inline} style={[style, { color: colors.text }]} />;
  }

  return (
    <View ref={(r) => anchors.register(id, r)} collapsable={false} accessibilityRole="header">
      {body}
    </View>
  );
}

/** Outline button for a block's attachment / video link. */
function ReaderAction({ icon, label, url }: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }) {
  const { colors, type } = useTheme();
  const { accent } = useReaderCtx();
  return (
    <PressableScale
      onPress={() => Linking.openURL(url).catch(() => notify("Couldn't open link"))}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={{
        alignSelf: "flex-start",
        marginTop: SPACE[4],
        minHeight: 48,
        paddingHorizontal: SPACE[5],
        borderRadius: RADII.md,
        borderWidth: 1.5,
        borderColor: accent.border,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
      }}
    >
      <Ionicons name={icon} size={18} color={accent.text} />
      <Text style={[type.button, { color: accent.text }]}>{label}</Text>
    </PressableScale>
  );
}

/** Question on its own line, then a bold primary-colour "Ans:" label and the answer. */
function QnABlock({ question, answer }: QnAParts) {
  const { colors, type, fontsLoaded } = useTheme();
  const bold = fontFamily("bold", fontsLoaded);
  return (
    <View style={{ gap: SPACE[1] }}>
      <InlineText nodes={question} style={[type.body, { color: colors.text, fontFamily: bold }]} />
      <Text style={[type.body, { color: colors.text }]}>
        <Text style={{ fontFamily: bold, color: colors.primaryText }}>Ans: </Text>
        <InlineText nodes={answer} />
      </Text>
    </View>
  );
}

function ListBlock({ ordered, items }: { ordered: boolean; items: ListItem[] }) {
  const { colors, type } = useTheme();
  const { accent } = useReaderCtx();
  return (
    <View style={{ gap: SPACE[2] + 1 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: "row", paddingLeft: it.level * SPACE[5] }}>
          {ordered ? (
            <Text style={[type.body, { width: 28, color: accent.text, fontFamily: type.title.fontFamily }]}>{it.n}.</Text>
          ) : (
            // visible accent bullet, vertically centred on the first line of text
            <View style={{ width: 22, height: type.body.lineHeight, justifyContent: "center" }}>
              <View
                style={{
                  width: it.level === 0 ? 7 : 6,
                  height: it.level === 0 ? 7 : 6,
                  borderRadius: 4,
                  backgroundColor: it.level === 0 ? accent.base : "transparent",
                  borderWidth: it.level === 0 ? 0 : 1.5,
                  borderColor: accent.base,
                  marginLeft: 4,
                }}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            {it.qna ? <QnABlock {...it.qna} /> : <InlineText nodes={it.inline} style={[type.body, { color: colors.text }]} />}
          </View>
        </View>
      ))}
    </View>
  );
}

function NodeView({ node }: { node: ReaderNode }) {
  const { colors, type } = useTheme();
  switch (node.t) {
    case "heading":
      return <HeadingBlock id={node.id} level={node.level} text={node.text} inline={node.inline} />;
    case "paragraph":
      return <InlineText nodes={node.inline} style={[type.body, { color: colors.text }]} />;
    case "qna":
      return <QnABlock question={node.question} answer={node.answer} />;
    case "list":
      return <ListBlock ordered={node.ordered} items={node.items} />;
    case "code":
      return <CodeBlock code={node.code} lang={node.lang} />;
    case "table":
      return <StyledTable header={node.header} rows={node.rows} />;
    case "quote":
      return (
        <View style={{ borderLeftWidth: 3, borderLeftColor: colors.border, backgroundColor: colors.canvas, paddingVertical: SPACE[3], paddingHorizontal: SPACE[4], borderRadius: RADII.sm }}>
          <InlineText nodes={node.inline} style={[type.body, { color: colors.textSecondary, fontSize: (type.body.fontSize ?? 17) - 1 }]} />
        </View>
      );
    case "hr":
      return <View style={{ height: 1, backgroundColor: colors.divider }} />;
    case "callout":
      return (
        <Callout id={node.id} kind={node.kind} icon={node.icon} label={node.label} level={node.level} variant={node.variant}>
          <NodeList nodes={node.children} />
        </Callout>
      );
  }
}

/** Renders nodes with the reader's vertical rhythm (32 above H2, 20 above H3, 16 between paragraphs). */
export function NodeList({ nodes }: { nodes: ReaderNode[] }) {
  return (
    <View>
      {nodes.map((n, i) => (
        <View key={i} style={{ marginTop: nodeGap(i === 0 ? null : nodes[i - 1], n) }}>
          <NodeView node={n} />
        </View>
      ))}
    </View>
  );
}

/**
 * The whole article body. Memoised on its (static) inputs, so the reader's
 * scroll-progress / menu / TOC state changes never re-render the markdown.
 */
export const ReaderContent = React.memo(function ReaderContent({ blocks }: { blocks: PreparedBlock[] }) {
  return (
    <View>
      {blocks.map((b, i) => (
        <View key={b.id} style={{ marginTop: i === 0 ? 0 : SPACE[8] }}>
          <NodeList nodes={b.nodes} />
          {b.fileUrl ? <ReaderAction icon="download-outline" label="Open attachment" url={b.fileUrl} /> : null}
          {b.videoUrl ? <ReaderAction icon="play-circle-outline" label="Watch video" url={b.videoUrl} /> : null}
        </View>
      ))}
    </View>
  );
});
