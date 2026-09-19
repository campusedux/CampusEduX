import React, { type ReactNode } from "react";
import { Linking, Text, type StyleProp, type TextStyle } from "react-native";
import { fontFamily, useTheme } from "@/theme";
import { notify } from "@/lib/notify";
import type { Inline } from "@/learning/reader/markdownParser";
import { useReaderCtx } from "./readerContext";

/**
 * Inline markdown → nested <Text>. Bold terms take the course accent, inline
 * code is a soft tinted monospace pill, links use the link colour.
 */
export function InlineText({ nodes, style, numberOfLines }: { nodes: Inline[]; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const { colors, type, fontsLoaded } = useTheme();
  const { accent } = useReaderCtx();
  const boldFamily = fontFamily("bold", fontsLoaded);

  const render = (list: Inline[], keyBase: string): ReactNode[] =>
    list.map((n, i) => {
      const key = `${keyBase}.${i}`;
      switch (n.t) {
        case "text":
          return n.v;
        case "bold":
          return (
            <Text key={key} style={{ fontFamily: boldFamily, color: accent.text }}>
              {render(n.c, key)}
            </Text>
          );
        case "italic":
          return (
            <Text key={key} style={{ fontStyle: "italic" }}>
              {render(n.c, key)}
            </Text>
          );
        case "code":
          return (
            <Text
              key={key}
              style={{
                fontFamily: type.codeInline.fontFamily,
                fontSize: (type.codeInline.fontSize ?? 14.5) - 0.5,
                color: colors.inlineCodeText,
                backgroundColor: colors.inlineCodeBg,
                borderRadius: 4,
              }}
            >
              {` ${n.v} `}
            </Text>
          );
        case "link":
          return (
            <Text
              key={key}
              accessibilityRole={n.href ? "link" : undefined}
              onPress={n.href ? () => Linking.openURL(n.href as string).catch(() => notify("Couldn't open link")) : undefined}
              style={{ color: n.href ? colors.link : undefined, textDecorationLine: n.href ? "underline" : "none" }}
            >
              {n.v}
            </Text>
          );
      }
    });

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {render(nodes, "i")}
    </Text>
  );
}
