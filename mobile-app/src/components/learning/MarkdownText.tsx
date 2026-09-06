import React, { type ReactNode } from "react";
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from "react-native";
import { compilerUrl, isRunnableLang } from "@/lib/compilerLink";
import { notify } from "@/lib/notify";

/**
 * Dependency-free Markdown renderer for Learning content on mobile. Renders a
 * documentation subset — headings, paragraphs, bold/italic, inline + fenced
 * code, ordered/unordered lists, blockquotes, GFM pipe tables, links, hr — to
 * React Native primitives. No HTML, no WebView, no extra dependency. Matches
 * the subset the admin editor previews and the website ships.
 */
/** Only allow http/https/mailto/tel + relative for admin-authored link URLs.
 *  Blocks javascript:, file:, data:, unknown schemes. */
function safeLinkUrl(raw: string): string | null {
  const u = (raw || "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^(\/|#|\.)/.test(u)) return u;
  return null;
}

export function MarkdownText({
  source,
  enableRunOnWeb = false,
}: {
  source: string;
  /** When true, a runnable fenced code block (```java, ```python, …) gets a
   *  link that opens the CampusEduX website compiler. The app itself never
   *  compiles or runs code. */
  enableRunOnWeb?: boolean;
}) {
  return <View>{renderBlocks(source ?? "", enableRunOnWeb)}</View>;
}

function openCompiler(lang: string, code: string) {
  Linking.openURL(compilerUrl(lang, code)).catch(() => notify("Couldn't open the compiler"));
}

// --- inline --------------------------------------------------------------
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re =
    /(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-i${i++}`;
    if (m[1]) {
      const url = safeLinkUrl(m[3]);
      nodes.push(
        url ? (
          <Text key={key} style={styles.link} onPress={() => Linking.openURL(url).catch(() => undefined)}>
            {m[2]}
          </Text>
        ) : (
          <Text key={key} style={styles.link}>{m[2]}</Text>
        ),
      );
    } else if (m[4]) {
      nodes.push(
        <Text key={key} style={styles.inlineCode}>
          {m[5]}
        </Text>,
      );
    } else if (m[6]) {
      nodes.push(
        <Text key={key} style={styles.bold}>
          {m[7] ?? m[8]}
        </Text>,
      );
    } else if (m[9]) {
      nodes.push(
        <Text key={key} style={styles.italic}>
          {m[10] ?? m[11]}
        </Text>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// --- blocks -------------------------------------------------------------
function renderBlocks(src: string, enableRunOnWeb = false): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      const codeText = buf.join("\n");
      const showRun = enableRunOnWeb && isRunnableLang(lang);
      out.push(
        <View key={`b${k++}`} style={styles.codeBlock}>
          {lang ? <Text style={styles.codeLang}>{lang.toUpperCase()}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeText}>{codeText}</Text>
          </ScrollView>
          {showRun ? (
            <Pressable
              onPress={() => openCompiler(lang, codeText)}
              style={styles.runButton}
              accessibilityRole="link"
              accessibilityLabel="Run this code on the CampusEduX website compiler"
            >
              <Text style={styles.runButtonText}>▶  Run on CampusEduX Compiler</Text>
            </Pressable>
          ) : null}
        </View>,
      );
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length, 4);
      out.push(
        <Text key={`b${k++}`} style={[styles.heading, HEADING_SIZE[level - 1]]}>
          {renderInline(h[2], `b${k}`)}
        </Text>,
      );
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(<View key={`b${k++}`} style={styles.hr} />);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(
        <View key={`b${k++}`} style={styles.quote}>
          <Text style={styles.quoteText}>{renderInline(buf.join(" "), `b${k}`)}</Text>
        </View>,
      );
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const parseRow = (r: string) =>
        r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      out.push(
        <ScrollView key={`b${k++}`} horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrap}>
          <View>
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              {header.map((c, ci) => (
                <Text key={ci} style={[styles.tableCell, styles.tableHeadCell]}>
                  {c}
                </Text>
              ))}
            </View>
            {rows.map((r, ri) => (
              <View key={ri} style={styles.tableRow}>
                {r.map((c, ci) => (
                  <Text key={ci} style={styles.tableCell}>
                    {renderInline(c, `td${ri}-${ci}`)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>,
      );
      continue;
    }

    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const olMatch = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const items: { marker: string; text: string }[] = [];
      let n = 1;
      while (i < lines.length) {
        const um = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
        const om = lines[i].match(/^(\s*)\d+[.)]\s+(.*)$/);
        const item = ordered ? om : um;
        if (!item) break;
        items.push({ marker: ordered ? `${n++}.` : "•", text: item[2] });
        i += 1;
      }
      out.push(
        <View key={`b${k++}`} style={styles.list}>
          {items.map((it, li) => (
            <View key={li} style={styles.listItem}>
              <Text style={styles.listMarker}>{it.marker}</Text>
              <Text style={styles.listText}>{renderInline(it.text, `li${li}`)}</Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }

    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*)[-*+]\s+/.test(lines[i]) &&
      !/^(\s*)\d+[.)]\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(
      <Text key={`b${k++}`} style={styles.paragraph}>
        {renderInline(buf.join(" "), `b${k}`)}
      </Text>,
    );
  }

  return out;
}

const HEADING_SIZE = [
  { fontSize: 20, marginTop: 20 },
  { fontSize: 18, marginTop: 16 },
  { fontSize: 16, marginTop: 14 },
  { fontSize: 15, marginTop: 12 },
];

const styles = StyleSheet.create({
  paragraph: { fontSize: 15, lineHeight: 23, color: "#374151", marginVertical: 6 },
  heading: { fontWeight: "700", color: "#111827", marginBottom: 6 },
  bold: { fontWeight: "700", color: "#111827" },
  italic: { fontStyle: "italic" },
  link: { color: "#4F39F6", textDecorationLine: "underline" },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#4F39F6",
    backgroundColor: "#EEF0FF",
    borderRadius: 4,
  },
  codeBlock: { backgroundColor: "#0f172a", borderRadius: 12, padding: 14, marginVertical: 10 },
  codeLang: { color: "#94a3b8", fontSize: 10, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
  codeText: { color: "#e2e8f0", fontFamily: "monospace", fontSize: 13, lineHeight: 20 },
  runButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  runButtonText: { color: "#c7d2fe", fontSize: 13, fontWeight: "600" },
  hr: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: "#C7CCFF",
    backgroundColor: "#F5F6FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  quoteText: { color: "#4B5563", fontSize: 14, lineHeight: 21 },
  list: { marginVertical: 6 },
  listItem: { flexDirection: "row", marginBottom: 4 },
  listMarker: { color: "#9CA3AF", width: 22, fontSize: 15, lineHeight: 23 },
  listText: { flex: 1, fontSize: 15, lineHeight: 23, color: "#374151" },
  tableWrap: { marginVertical: 10 },
  tableRow: { flexDirection: "row" },
  tableHeadRow: { backgroundColor: "#EEF0FF" },
  tableCell: {
    minWidth: 110,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#374151",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  tableHeadCell: { fontWeight: "700", color: "#111827" },
});

export default MarkdownText;
