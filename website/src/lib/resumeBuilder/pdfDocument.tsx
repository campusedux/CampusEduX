import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { buildResumeRenderModel } from "./renderModel";
import { templateSpec } from "./templateSpecs";
import { resolveDesign, effectiveAccent } from "./design";
import type { ResumeDocument } from "./types";

const BULLET_RE = /^\s*[•\-–*]\s+/;

/**
 * Real PDF markup driven by the same TemplateSpec (templateSpecs.ts) as the
 * on-screen <ResumeDocumentView> — font family, header alignment, heading
 * rule style and whether the accent colour is used all track the chosen
 * template, so "Modern" and "Professional" export as visibly different
 * documents rather than the same layout in two colours. Text wraps naturally
 * across A4 pages (no clipping); margins and the accent rule are consistent.
 */
export function ResumePdfDocument({ resume, accentColor }: { resume: ResumeDocument; accentColor: string }) {
  const model = buildResumeRenderModel({ personalDetails: resume.personalDetails, content: resume.content });
  const spec = resolveDesign(templateSpec(resume.template), resume.design);
  const accentColorEff = effectiveAccent(accentColor, resume.design);
  const showAccent = spec.accent !== "none";
  const accent = showAccent && spec.accent === "bold" ? accentColorEff : showAccent ? "#1f2937" : "#374151";
  const headingColor = spec.heading === "full-underline" ? "#000000" : accent;
  const centered = spec.header === "centered-serif";
  const boldFont = spec.pdfFont === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";

  const pad = Math.max(24, Math.round(spec.type.padding * 0.82));
  const styles = StyleSheet.create({
    page: { padding: pad, fontSize: +(spec.type.body).toFixed(1), fontFamily: spec.pdfFont, color: "#111827", lineHeight: spec.type.lineHeight },
    name: { fontSize: spec.type.name * 0.72, fontFamily: boldFont, textAlign: centered ? "center" : "left" },
    jobTitle: { fontSize: 11, marginTop: 2, marginBottom: 8, textAlign: centered ? "center" : "left", color: showAccent && spec.accent === "bold" ? accentColorEff : "#374151" },
    contact: { fontSize: 9, color: "#6B7280", marginBottom: 10, textAlign: centered ? "center" : "left" },
    rule: { borderBottomWidth: centered ? 1.5 : 2, borderBottomColor: centered ? "#000000" : accent, marginBottom: 12 },
    sectionHeading: {
      fontSize: 10,
      fontFamily: boldFont,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: headingColor,
      marginTop: 12,
      marginBottom: 4,
      borderBottomWidth: spec.heading === "full-underline" ? 1 : 0,
      borderBottomColor: "#000000",
      paddingBottom: spec.heading === "full-underline" ? 2 : 0,
    },
    line: { fontSize: 10, marginBottom: 2 },
    bullet: { fontSize: 10, marginBottom: 2, paddingLeft: 10 },
    entry: { marginBottom: 6 },
    entryHead: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontSize: 10.5, fontFamily: boldFont },
    entryMeta: { fontSize: 9, color: "#6B7280" },
    entryTags: { fontSize: 9, color: "#6B7280", marginTop: 1 },
  });

  const bullet = spec.bulletChar || "•";

  return (
    <Document title={resume.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{model.fullName}</Text>
        {model.jobTitle ? <Text style={styles.jobTitle}>{model.jobTitle}</Text> : null}
        {model.contactLine ? <Text style={styles.contact}>{model.contactLine}</Text> : null}
        <View style={styles.rule} />
        {model.blocks.map((block) => (
          <View key={block.id} wrap>
            <Text style={styles.sectionHeading}>{block.heading}</Text>

            {block.variant === "entries" && block.entries
              ? block.entries.map((entry, i) => (
                  <View key={i} style={styles.entry} wrap={false}>
                    <View style={styles.entryHead}>
                      <Text style={styles.entryTitle}>
                        {entry.title}
                        {entry.subtitle ? ` — ${entry.subtitle}` : ""}
                      </Text>
                      {entry.meta ? <Text style={styles.entryMeta}>{entry.meta}</Text> : null}
                    </View>
                    {entry.bullets.map((b, j) => (
                      <Text key={j} style={styles.bullet}>
                        {bullet}  {b}
                      </Text>
                    ))}
                    {entry.tags.length ? <Text style={styles.entryTags}>{entry.tags.join(" · ")}</Text> : null}
                    {entry.url ? <Text style={styles.entryTags}>{entry.url}</Text> : null}
                  </View>
                ))
              : block.lines.map((rawLine, index) => {
                  const isBullet = BULLET_RE.test(rawLine);
                  const text = isBullet ? `${bullet}  ${rawLine.replace(BULLET_RE, "")}` : rawLine;
                  return (
                    <Text key={index} style={isBullet ? styles.bullet : styles.line}>
                      {text}
                    </Text>
                  );
                })}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderResumePdfBuffer(resume: ResumeDocument, accentColor: string): Promise<Buffer> {
  return renderToBuffer(<ResumePdfDocument resume={resume} accentColor={accentColor} />);
}
