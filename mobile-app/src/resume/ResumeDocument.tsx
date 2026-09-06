import React from "react";
import { View, Text } from "react-native";
import type { ResumeRenderModel, ResumeRenderBlock, ResumeRenderEntry } from "@/services/resumeContent";
import type { TemplateSpec } from "@/services/resumeTemplateSpecs";

/**
 * The React Native A4 résumé renderer — the structural mirror of the
 * website's <ResumeDocumentView>. One component, four visually distinct
 * designs driven by `spec` (resumeTemplateSpecs.ts + resumeDesign.ts).
 * Renders at a fixed logical width; callers (<ResumeSheet>, <ResumeThumbnail>)
 * scale it. Pure — no data fetching, no hooks.
 */

export const A4_WIDTH = 794;
export const A4_MIN_HEIGHT = 1123;

const INK = "#111827";
const INK_MUTED = "#374151";
const INK_FAINT = "#6B7280";
const HAIRLINE = "#E5E7EB";

export function ResumeDocument({
  model,
  spec,
  accentColor,
}: {
  model: ResumeRenderModel;
  spec: TemplateSpec;
  accentColor: string;
}) {
  const t = spec.type;
  const showAccent = spec.accent !== "none";
  const accent = showAccent ? accentColor : INK_MUTED;
  const isBand = spec.header === "accent-band";
  const pad = isBand ? 0 : t.padding + 4;

  return (
    <View style={{ width: A4_WIDTH, minHeight: A4_MIN_HEIGHT, backgroundColor: "#fff", padding: pad }}>
      <Header model={model} spec={spec} accent={accent} showAccent={showAccent} />
      <View style={isBand ? { paddingHorizontal: t.padding + 8, paddingTop: t.padding + 4 } : undefined}>
        {model.blocks.map((block) => (
          <Section key={block.id} block={block} spec={spec} accent={accent} showAccent={showAccent} />
        ))}
      </View>
    </View>
  );
}

function Header({ model, spec, accent, showAccent }: { model: ResumeRenderModel; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  const centered = spec.header === "centered-serif";
  const band = spec.header === "accent-band";
  const titleColor = band ? "rgba(255,255,255,0.92)" : showAccent && spec.accent === "bold" ? accent : INK_MUTED;
  const contactColor = band ? "rgba(255,255,255,0.8)" : INK_FAINT;
  const align: "center" | "auto" = centered ? "center" : "auto";

  const inner = (
    <>
      <Text style={{ fontSize: t.name, fontWeight: spec.header === "left-plain" ? "400" : "700", color: band ? "#fff" : INK, fontFamily: spec.rnFont, textAlign: align }}>
        {model.fullName}
      </Text>
      {!!model.jobTitle && (
        <Text style={{ fontSize: t.title, fontWeight: "500", marginTop: 3, color: titleColor, fontFamily: spec.rnFont, textAlign: align, textTransform: centered ? "uppercase" : "none", letterSpacing: centered ? 1.2 : 0 }}>
          {model.jobTitle}
        </Text>
      )}
      {!!model.contactLine && (
        <Text style={{ fontSize: t.small, marginTop: 6, color: contactColor, fontFamily: spec.rnFont, textAlign: align }}>{model.contactLine}</Text>
      )}
    </>
  );

  if (band) return <View style={{ backgroundColor: accent, paddingVertical: t.padding, paddingHorizontal: t.padding + 8 }}>{inner}</View>;
  if (centered)
    return <View style={{ alignItems: "center", paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: INK, marginBottom: t.sectionGap }}>{inner}</View>;
  return (
    <View
      style={{
        paddingBottom: 12,
        borderBottomWidth: spec.header === "left-accent" ? 2 : 1,
        borderBottomColor: spec.header === "left-accent" ? accent : HAIRLINE,
        marginBottom: t.sectionGap,
      }}
    >
      {inner}
    </View>
  );
}

function Heading({ text, spec, accent, showAccent }: { text: string; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  const base = {
    fontSize: t.heading,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: spec.heading === "plain-caps" ? 1.4 : 0.5,
    marginBottom: 6,
    fontFamily: spec.rnFont,
  };

  if (spec.heading === "full-underline")
    return (
      <Text style={{ ...base, color: showAccent && spec.accent === "bold" ? accent : "#000", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 3 }}>
        {text}
      </Text>
    );
  if (spec.heading === "plain-caps") return <Text style={{ ...base, fontWeight: "600", color: INK_FAINT }}>{text}</Text>;
  if (spec.heading === "bar")
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <View style={{ width: 4, height: t.heading + 2, backgroundColor: accent, borderRadius: 2, marginRight: 8 }} />
        <Text style={{ ...base, marginBottom: 0, color: INK }}>{text}</Text>
      </View>
    );
  // rule (modern)
  return (
    <Text style={{ ...base, color: showAccent ? accent : INK, borderBottomWidth: 1, borderBottomColor: showAccent ? `${accent}55` : HAIRLINE, paddingBottom: 3 }}>
      {text}
    </Text>
  );
}

function Entry({ entry, spec, accent, showAccent }: { entry: ResumeRenderEntry; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ flex: 1, fontWeight: "700", color: INK, fontFamily: spec.rnFont, fontSize: t.body }}>
          {entry.title}
          {!!entry.subtitle && <Text style={{ fontWeight: "500", color: INK_MUTED }}> — {entry.subtitle}</Text>}
        </Text>
        {!!entry.meta && <Text style={{ fontSize: t.small, color: INK_FAINT, marginLeft: 8, fontFamily: spec.rnFont }}>{entry.meta}</Text>}
      </View>
      {entry.bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: 1 }}>
          <Text style={{ color: showAccent ? accent : INK_FAINT, marginRight: 6, fontSize: t.body }}>{spec.bulletChar || "•"}</Text>
          <Text style={{ flex: 1, color: INK_MUTED, fontSize: t.body, fontFamily: spec.rnFont, lineHeight: t.body * t.lineHeight }}>{b}</Text>
        </View>
      ))}
      {entry.tags.length > 0 && <Text style={{ marginTop: 2, fontSize: t.small, color: INK_FAINT, fontFamily: spec.rnFont }}>{entry.tags.join(" · ")}</Text>}
      {!!entry.url && <Text style={{ marginTop: 1, fontSize: t.small, color: showAccent ? accent : INK_FAINT }}>{entry.url}</Text>}
    </View>
  );
}

function TagChips({ chips, spec, accent, showAccent }: { chips: string[]; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {chips.map((item, i) => (
        <Text
          key={i}
          style={{
            fontSize: spec.type.small,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginRight: 6,
            marginBottom: 6,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: showAccent ? `${accent}14` : "#F3F4F6",
            color: showAccent ? accent : INK_MUTED,
            borderWidth: 1,
            borderColor: showAccent ? `${accent}33` : HAIRLINE,
            fontFamily: spec.rnFont,
          }}
        >
          {item}
        </Text>
      ))}
    </View>
  );
}

function Section({ block, spec, accent, showAccent }: { block: ResumeRenderBlock; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  const line = (txt: string, i: number) => (
    <Text key={i} style={{ color: INK_MUTED, marginBottom: 2, fontSize: t.body, fontFamily: spec.rnFont, lineHeight: t.body * t.lineHeight }}>
      {txt}
    </Text>
  );

  return (
    <View style={{ marginTop: t.sectionGap }}>
      <Heading text={block.heading} spec={spec} accent={accent} showAccent={showAccent} />
      {block.variant === "entries" && block.entries ? (
        block.entries.map((e, i) => <Entry key={i} entry={e} spec={spec} accent={accent} showAccent={showAccent} />)
      ) : block.variant === "tags" && block.chips ? (
        spec.skills === "chips" ? (
          <TagChips chips={block.chips} spec={spec} accent={accent} showAccent={showAccent} />
        ) : (
          block.lines.map(line)
        )
      ) : block.variant === "links" && block.links ? (
        block.links.map((l, i) => (
          <Text key={i} style={{ marginBottom: 2, fontSize: t.body, fontFamily: spec.rnFont }}>
            {!!l.label && <Text style={{ fontWeight: "600", color: INK }}>{l.label}: </Text>}
            <Text style={{ color: showAccent ? accent : INK_MUTED }}>{l.url}</Text>
          </Text>
        ))
      ) : (
        block.lines.map(line)
      )}
    </View>
  );
}

export default ResumeDocument;
