import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Share } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { notify } from "@/lib/notify";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useTemplateCatalog, useCreateResumeShare, useUpdateResumeDesign } from "@/hooks/useResume";
import { buildResumeRenderModel } from "@/services/resumeContent";
import { templateSpec } from "@/services/resumeTemplateSpecs";
import { resolveDesign, effectiveAccent } from "@/services/resumeDesign";
import { ResumeDocument } from "@/resume/ResumeDocument";
import { ResumeSheet } from "@/resume/ResumeSheet";
import { DesignSheet } from "@/resume/DesignSheet";
import type { ResumeDesign, ResumeStackParamList } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "PreviewResume">;

function BarButton({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 48, borderRadius: 12, backgroundColor: primary ? "#4F39F6" : "#F3F4F6" }}
    >
      <Ionicons name={icon} size={18} color={primary ? "#fff" : "#374151"} />
      <Text style={{ fontSize: 10, fontWeight: "600", marginTop: 2, color: primary ? "#fff" : "#374151" }}>{label}</Text>
    </Pressable>
  );
}

export function PreviewResumeScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const { data: catalog } = useTemplateCatalog();
  const createShare = useCreateResumeShare();
  const updateDesign = useUpdateResumeDesign(params.resumeId);

  const [design, setDesign] = useState<ResumeDesign>({});
  const [designOpen, setDesignOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (resume) setDesign(resume.design ?? {});
  }, [resume]);

  if (isLoading || !resume)
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading preview..." />
      </Screen>
    );
  if (isError)
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this résumé." onRetry={refetch} />
      </Screen>
    );

  const catalogAccent = catalog?.find((t) => t.id === resume.template)?.accentColor ?? "#4F39F6";
  const spec = resolveDesign(templateSpec(resume.template), design);
  const accent = effectiveAccent(catalogAccent, design);
  const model = buildResumeRenderModel({ personalDetails: resume.personalDetails, content: resume.content });

  const applyDesign = (next: ResumeDesign) => {
    setDesign(next);
    updateDesign.mutate(next);
  };

  const handleShareLink = async () => {
    setSharing(true);
    try {
      const url = await createShare.mutateAsync(params.resumeId);
      await Share.share({ message: url });
    } catch (error: any) {
      notify("Couldn't create a share link", error.message ?? "Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-5 mt-2 mb-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Preview</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("ATSScore", { resumeId: params.resumeId })} hitSlop={8}>
          <Text className="text-primary text-sm font-semibold">ATS</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <ResumeSheet>
          <ResumeDocument model={model} spec={spec} accentColor={accent} />
        </ResumeSheet>
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
        <BarButton icon="color-palette-outline" label="Template" onPress={() => (navigation as any).navigate("Templates", { resumeId: params.resumeId })} />
        <BarButton icon="options-outline" label="Design" onPress={() => setDesignOpen(true)} />
        <BarButton icon="share-social-outline" label={sharing ? "…" : "Share"} onPress={handleShareLink} />
        <BarButton icon="download-outline" label="Download" primary onPress={() => (navigation as any).navigate("DownloadPDF", { resumeId: params.resumeId })} />
      </View>

      <DesignSheet visible={designOpen} design={design} onChange={applyDesign} onClose={() => setDesignOpen(false)} />
    </Screen>
  );
}

export default PreviewResumeScreen;
