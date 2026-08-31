import React, { useMemo } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LEGAL_VERSIONS, legalUrl } from "@/constants/legal";
import type { LegalDocId, LegalDocument, LegalSection } from "@/types";
import { interpolateDocument } from "./interpolate";
import { LEGAL_DOCUMENTS } from "./content";

/** "2026-08-31" -> "31 August 2026" */
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View className="mt-1">
      {items.map((item, i) => (
        <View key={i} className="flex-row mb-1.5">
          <Text className="text-gray-500 mr-2">•</Text>
          <Text className="flex-1 text-gray-600 text-sm leading-5">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <View className="mb-5">
      <Text className="font-bold text-gray-900 mb-1.5">{section.heading}</Text>
      {section.body?.map((p, i) => (
        <Text key={i} className="text-gray-600 text-sm leading-5 mb-1.5">
          {p}
        </Text>
      ))}
      {section.bullets ? <Bullets items={section.bullets} /> : null}
      {section.subsections?.map((sub, i) => (
        <View key={i} className="mt-3 ml-1">
          <Text className="font-semibold text-gray-800 text-sm mb-1">{sub.heading}</Text>
          {sub.body?.map((p, j) => (
            <Text key={j} className="text-gray-600 text-sm leading-5 mb-1.5">
              {p}
            </Text>
          ))}
          {sub.bullets ? <Bullets items={sub.bullets} /> : null}
        </View>
      ))}
    </View>
  );
}

interface Props {
  docId: LegalDocId;
  /** Related-policy chips shown at the bottom; tapping one calls this. */
  onNavigateRelated?: (id: LegalDocId) => void;
  /** Extra actions (e.g. mailto, delete button) rendered above the footer. */
  footerExtras?: React.ReactNode;
}

const RELATED: Record<LegalDocId, LegalDocId[]> = {
  "privacy-policy": ["data-and-permissions", "delete-account", "terms"],
  terms: ["privacy-policy", "refund-policy", "project-license", "disclaimer"],
  "refund-policy": ["terms", "project-license", "contact"],
  "project-license": ["terms", "community-guidelines"],
  "community-guidelines": ["terms", "disclaimer"],
  disclaimer: ["terms", "project-license"],
  "data-and-permissions": ["privacy-policy", "delete-account"],
  "delete-account": ["privacy-policy", "data-and-permissions", "contact"],
  contact: ["privacy-policy", "terms", "delete-account"],
};

export function LegalDocumentBody({ docId, onNavigateRelated, footerExtras }: Props) {
  const doc: LegalDocument = useMemo(
    () => interpolateDocument(LEGAL_DOCUMENTS[docId]),
    [docId],
  );
  const meta = LEGAL_VERSIONS[docId];

  return (
    <View>
      <Text className="text-xl font-bold text-gray-900 mb-1">{doc.title}</Text>
      <Text className="text-gray-400 text-xs mb-4">
        Version {meta.version} · Last updated {formatDate(meta.effectiveDate)}
      </Text>

      {doc.intro.map((p, i) => (
        <Text key={i} className="text-gray-600 text-sm leading-5 mb-2">
          {p}
        </Text>
      ))}

      <View className="h-px bg-gray-100 my-4" />

      {doc.sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}

      {footerExtras}

      <Pressable
        onPress={() => Linking.openURL(legalUrl(docId)).catch(() => undefined)}
        className="flex-row items-center justify-center border border-gray-200 rounded-2xl py-3 mt-2 mb-5"
      >
        <Ionicons name="open-outline" size={16} color="#4F39F6" />
        <Text className="text-primary text-sm font-medium ml-2">Open on our website</Text>
      </Pressable>

      {RELATED[docId].length > 0 && (
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Related policies</Text>
          <View className="flex-row flex-wrap">
            {RELATED[docId].map((rid) => (
              <Pressable
                key={rid}
                onPress={() => onNavigateRelated?.(rid)}
                className="border border-gray-200 rounded-full px-3 py-1.5 mr-2 mb-2"
              >
                <Text className="text-gray-700 text-xs">{LEGAL_DOCUMENTS[rid].title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default LegalDocumentBody;
