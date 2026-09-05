import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { buildResumeRenderModel } from "./renderModel";
import type { ResumeDocument } from "./types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: "#111827" },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  jobTitle: { fontSize: 11, marginTop: 2, marginBottom: 8 },
  contact: { fontSize: 9, color: "#6B7280", marginBottom: 12 },
  rule: { borderBottomWidth: 2, marginBottom: 12 },
  sectionHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  line: { fontSize: 10, lineHeight: 1.5, marginBottom: 2 },
});

/** Real PDF markup — no clipped text (View/Text wrap naturally across pages), consistent margins, an accent rule matching the chosen template's color. */
export function ResumePdfDocument({ resume, accentColor }: { resume: ResumeDocument; accentColor: string }) {
  const model = buildResumeRenderModel(resume);

  return (
    <Document title={resume.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{model.fullName}</Text>
        {model.jobTitle ? <Text style={[styles.jobTitle, { color: accentColor }]}>{model.jobTitle}</Text> : null}
        {model.contactLine ? <Text style={styles.contact}>{model.contactLine}</Text> : null}
        <View style={[styles.rule, { borderBottomColor: accentColor }]} />
        {model.blocks.map((block) => (
          <View key={block.key}>
            <Text style={[styles.sectionHeading, { color: accentColor }]}>{block.heading}</Text>
            {block.lines.map((line, index) => (
              <Text key={index} style={styles.line}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderResumePdfBuffer(resume: ResumeDocument, accentColor: string): Promise<Buffer> {
  return renderToBuffer(<ResumePdfDocument resume={resume} accentColor={accentColor} />);
}
