import React, { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, ScrollView, Text, View, type TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { PressableScale } from "@/components/ui/PressableScale";
import { RADII, SPACE, TOUCH, useTheme } from "@/theme";
import { compilerUrl, isRunnableLang } from "@/lib/compilerLink";
import { notify } from "@/lib/notify";
import { tokenize, type TokenKind } from "@/learning/reader/highlight";
import { useReaderCtx } from "./readerContext";

/** Highlighting is skipped above this size (keeps the span count sane on very long dumps). */
const MAX_HIGHLIGHT_CHARS = 20000;
/** Show line numbers from this many lines up. */
const LINE_NUMBERS_FROM = 5;

const NO_WRAP = Platform.OS === "web" ? ({ whiteSpace: "pre" } as unknown as TextStyle) : null;
const NO_SELECT = Platform.OS === "web" ? ({ userSelect: "none" } as unknown as TextStyle) : null;

/**
 * Dark code card: language label, Copy (with "Copied ✓"), syntax highlighting
 * (SQL / Python / Java / JS), line numbers on longer blocks, horizontal scroll —
 * never wraps. Memoised: scrolling the page never re-renders it.
 */
export const CodeBlock = React.memo(function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { colors, type } = useTheme();
  const { enableRun } = useReaderCtx();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const tokens = useMemo(() => (code.length > MAX_HIGHLIGHT_CHARS ? [{ text: code, kind: "plain" as TokenKind }] : tokenize(code, lang)), [code, lang]);
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const showNumbers = lineCount >= LINE_NUMBERS_FROM;
  const canRun = enableRun && isRunnableLang(lang);

  const color: Record<TokenKind, string> = {
    plain: colors.codeText,
    keyword: colors.syntax.keyword,
    string: colors.syntax.string,
    number: colors.syntax.number,
    comment: colors.syntax.comment,
    fn: colors.syntax.fn,
    type: colors.syntax.type,
    operator: colors.syntax.operator,
  };

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      notify("Couldn't copy");
    }
  };

  const codeStyle = [type.code, { color: colors.codeText }, NO_WRAP];

  return (
    <View style={{ backgroundColor: colors.codeBg, borderRadius: RADII.lg, borderWidth: 1, borderColor: colors.codeBorder, overflow: "hidden" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 40,
          paddingLeft: SPACE[4],
          paddingRight: SPACE[1],
          backgroundColor: colors.codeHeader,
          borderBottomWidth: 1,
          borderBottomColor: colors.codeBorder,
        }}
      >
        <Text style={[type.overline, { color: colors.codeMuted }]}>{lang || "code"}</Text>
        <PressableScale
          onPress={copy}
          activeScale={0.94}
          accessibilityLabel={copied ? "Code copied" : "Copy code"}
          hitSlop={{ top: 2, bottom: 2 }}
          style={{ minHeight: 36, minWidth: TOUCH.min, paddingHorizontal: SPACE[3], flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={15} color={copied ? colors.syntax.string : colors.codeMuted} />
          <Text style={[type.caption, { color: copied ? colors.syntax.string : colors.codeMuted }]}>{copied ? "Copied ✓" : "Copy"}</Text>
        </PressableScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled contentContainerStyle={{ padding: SPACE[4], paddingBottom: SPACE[3] }}>
        {showNumbers ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[type.code, { color: colors.codeLineNumber, textAlign: "right", marginRight: SPACE[4], minWidth: String(lineCount).length * 9 }, NO_WRAP, NO_SELECT]}
          >
            {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
          </Text>
        ) : null}
        <Text selectable style={codeStyle}>
          {tokens.map((t, i) => (t.kind === "plain" ? t.text : (
            <Text key={i} style={{ color: color[t.kind] }}>
              {t.text}
            </Text>
          )))}
        </Text>
      </ScrollView>

      {canRun ? (
        <PressableScale
          onPress={() => Linking.openURL(compilerUrl(lang, code)).catch(() => notify("Couldn't open the compiler"))}
          accessibilityRole="link"
          accessibilityLabel="Run this code on the CampusEduX website compiler"
          style={{
            alignSelf: "flex-start",
            minHeight: 36,
            marginLeft: SPACE[4],
            marginBottom: SPACE[3],
            paddingHorizontal: SPACE[3],
            borderRadius: RADII.sm,
            borderWidth: 1,
            borderColor: colors.codeBorder,
            backgroundColor: colors.codeHeader,
            justifyContent: "center",
          }}
        >
          <Text style={[type.caption, { color: colors.syntax.fn }]}>▶  Run on CampusEduX Compiler</Text>
        </PressableScale>
      ) : null}
    </View>
  );
});
