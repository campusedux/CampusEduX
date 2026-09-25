import React from "react";
import { ScrollView, View } from "react-native";
import { RADII, SPACE, useTheme } from "@/theme";
import type { Inline } from "@/learning/reader/markdownParser";
import { InlineText } from "./InlineText";
import { useReaderCtx } from "./readerContext";

const COL_MIN = 120;
const COL_MAX = 300;

/** Bordered table: accent-tinted header, zebra rows, horizontal scroll when wider than the screen. */
export const StyledTable = React.memo(function StyledTable({ header, rows }: { header: Inline[][]; rows: Inline[][][] }) {
  const { colors, type } = useTheme();
  const { accent } = useReaderCtx();
  const cols = Math.max(header.length, ...rows.map((r) => r.length));
  const cell = (border: boolean) => ({
    minWidth: COL_MIN,
    maxWidth: COL_MAX,
    flexGrow: 1,
    flexBasis: COL_MIN,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2] + 2,
    borderRightWidth: border ? 1 : 0,
    borderColor: colors.border,
  });
  const textStyle = [type.small, { fontSize: (type.small.fontSize ?? 13) + 1, lineHeight: 21, color: colors.text }];

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: RADII.md, overflow: "hidden" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <View style={{ minWidth: "100%" }}>
          <View style={{ flexDirection: "row", backgroundColor: accent.soft, borderBottomWidth: 1, borderColor: colors.border }}>
            {Array.from({ length: cols }, (_, ci) => (
              <View key={ci} style={cell(ci < cols - 1)}>
                {header[ci] ? (
                  <InlineText nodes={header[ci]} style={[type.small, { color: accent.text, fontFamily: type.title.fontFamily, fontSize: 14 }]} />
                ) : null}
              </View>
            ))}
          </View>
          {rows.map((r, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: "row",
                backgroundColor: ri % 2 === 1 ? colors.canvas : colors.surface,
                borderBottomWidth: ri < rows.length - 1 ? 1 : 0,
                borderColor: colors.borderSoft,
              }}
            >
              {Array.from({ length: cols }, (_, ci) => (
                <View key={ci} style={cell(ci < cols - 1)}>
                  {r[ci] ? <InlineText nodes={r[ci]} style={textStyle} /> : null}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});
