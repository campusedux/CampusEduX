import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Linking, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { customProjectsService } from "@/services/customProjects.service";
import {
  useCustomProjectDetail,
  useSendCustomMessage,
  useCustomProjectBalance,
  useCustomProjectEdits,
} from "@/hooks/useCustomProjects";
import { money, rupees } from "./components/format";
import { ProjectValueCard } from "./components/ProjectValueCard";
import { AddonsSection } from "./components/AddonsSection";
import { EditRequestSheet } from "./components/EditRequestSheet";
import {
  CUSTOM_PLATFORM_LABELS,
  CUSTOM_PROJECT_PROGRESS,
  CUSTOM_STATUS_LABELS,
  type CustomProjectStatus,
  type CustomProjectsStackParamList,
} from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "CustomProjectDetail">;
type Rte = RouteProp<CustomProjectsStackParamList, "CustomProjectDetail">;

const STATUS_ORDER: CustomProjectStatus[] = ["new", "in_development", "testing", "ready", "delivered"];

const TIMELINE_STEPS = [
  { label: "Project Configured", reached: () => true },
  { label: "Token Paid", reached: (paid: boolean) => paid },
  { label: "Request Created", reached: (paid: boolean) => paid },
  { label: "Development Started", reached: (_p: boolean, i: number) => i >= 1 },
  { label: "Testing", reached: (_p: boolean, i: number) => i >= 2 },
  { label: "Ready", reached: (_p: boolean, i: number) => i >= 3 },
  { label: "Delivered", reached: (_p: boolean, i: number) => i >= 4 },
];

const ACTIVITY_LABEL: Record<string, string> = {
  new: "Request created · token payment successful",
  in_development: "Development started",
  testing: "Testing started",
  ready: "Project ready",
  delivered: "Project delivered",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="font-bold text-gray-900 mb-2">{title}</Text>
      {children}
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-gray-500">{k}</Text>
      <Text className="text-gray-900 font-medium flex-1 text-right ml-3" numberOfLines={2}>
        {v || "—"}
      </Text>
    </View>
  );
}

export function CustomProjectDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useCustomProjectDetail(params.requestId);
  const sendMessage = useSendCustomMessage(params.requestId);
  const { pay: payBalance, isProcessing: isPayingBalance } = useCustomProjectBalance(params.requestId);
  const edits = useCustomProjectEdits(params.requestId);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading request…" />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this request." onRetry={refetch} />
      </Screen>
    );
  }

  const paid = data.tokenPaymentStatus === "paid";
  const statusIdx = STATUS_ORDER.indexOf(data.status);
  const pct = CUSTOM_PROJECT_PROGRESS[data.status] ?? 0;
  // Every money figure comes from custom_project_amounts() (migration 0128) — never computed here.
  const due = data.amounts?.due ?? 0;
  const canPay = data.amounts != null && due > 0 && data.status !== "cancelled";
  const editable = data.status === "new";

  const openStorage = async (path: string, bucket: "uploads" | "deliveries") => {
    setOpeningPath(path);
    try {
      const url = await customProjectsService.getSignedUrl(path, bucket);
      if (url) await Linking.openURL(url);
      else notify("Unavailable", "Could not open that file.");
    } finally {
      setOpeningPath(null);
    }
  };

  const handlePayBalance = async () => {
    const result = await payBalance();
    if (result.status === "success") notify("Payment received", "Thanks — your balance has been updated.");
    else if (result.status === "failed") notify("Payment not completed", result.message);
    // "cancelled" (user dismissed checkout): silent, same as the token flow.
  };

  const send = async () => {
    const text = msg.trim();
    if (!text) return;
    setMsg("");
    try {
      await sendMessage.mutateAsync(text);
    } catch (e: any) {
      setMsg(text);
      notify("Message not sent", e?.message ?? "Please try again.");
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {data.title}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-400 font-mono text-xs">{data.requestCode}</Text>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#EEF0FF" }}>
            <Text className="text-primary text-xs font-semibold">{CUSTOM_STATUS_LABELS[data.status]}</Text>
          </View>
        </View>

        <View className="h-2 rounded-full bg-gray-100 overflow-hidden mt-3">
          <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4F39F6" }} />
        </View>
        <Text className="text-gray-400 text-xs mt-1">{pct}% complete</Text>

        <Section title="Timeline">
          {TIMELINE_STEPS.map((step, i) => {
            const done = step.reached(paid, statusIdx);
            return (
              <View key={step.label} className="flex-row items-center py-1.5">
                <Ionicons
                  name={done ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={done ? "#16A34A" : "#D1D5DB"}
                />
                <Text className={`ml-2.5 ${done ? "text-gray-800" : "text-gray-400"}`}>{step.label}</Text>
                {i === 0 ? null : null}
              </View>
            );
          })}
        </Section>

        <Section title="Summary">
          <View className="rounded-2xl border border-gray-100 p-4">
            <KV k="Type" v={data.projectType[0].toUpperCase() + data.projectType.slice(1)} />
            <KV k="Level" v={data.projectLevel} />
            <KV k="Platform" v={CUSTOM_PLATFORM_LABELS[data.platform]} />
            <KV k="Technology" v={data.technologyPreference} />
          </View>
        </Section>

        <Section title="Brief">
          <View className="rounded-2xl border border-gray-100 p-4">
            {data.objective ? <KV k="Objective" v={data.objective} /> : null}
            {data.problemStatement ? <KV k="Problem" v={data.problemStatement} /> : null}
            {data.description ? <KV k="Description" v={data.description} /> : null}
            {data.targetUsers ? <KV k="Target users" v={data.targetUsers} /> : null}
            {data.deadline ? <KV k="Deadline" v={new Date(`${data.deadline}T00:00:00`).toLocaleDateString()} /> : null}
            {!(data.objective || data.problemStatement || data.description || data.targetUsers || data.deadline) ? (
              <Text className="text-gray-400">No brief added.</Text>
            ) : null}
          </View>
          {editable ? (
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              className="mt-2 flex-row items-center self-start rounded-xl border border-gray-200 px-3 py-2.5"
            >
              <Ionicons name="create-outline" size={16} color="#4F39F6" />
              <Text className="text-primary font-semibold ml-1.5">Edit request</Text>
            </Pressable>
          ) : (
            <Text className="text-gray-400 text-xs mt-2">
              Details are locked now that work has started — add an extra feature or message the team.
            </Text>
          )}
        </Section>

        <Section title="Pricing">
          <View className="rounded-2xl border border-gray-100 p-4 mb-3">
            <Text className="text-gray-400 text-xs font-semibold mb-1">ORIGINAL ESTIMATE</Text>
            <KV k="Base price" v={rupees(data.basePrice)} />
            <KV k="Features" v={rupees(data.featureTotal)} />
            <KV k="Platform charges" v={rupees(data.platformCharge)} />
            <KV k="Estimated total" v={rupees(data.estimatedTotal)} />
          </View>
          {data.amounts ? (
            <ProjectValueCard
              amounts={data.amounts}
              acceptedAddons={data.addons.filter((a) => a.status === "accepted")}
              estimatedTotal={data.estimatedTotal}
            />
          ) : (
            <Text className="text-sm" style={{ color: "#DC2626" }}>
              Couldn&apos;t load the payment summary. Pull to refresh or reopen this screen.
            </Text>
          )}
          {canPay ? (
            <Pressable
              onPress={handlePayBalance}
              disabled={isPayingBalance}
              className="mt-3 rounded-xl py-3 items-center flex-row justify-center"
              style={{ backgroundColor: "#4F39F6", opacity: isPayingBalance ? 0.6 : 1 }}
            >
              {isPayingBalance ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Pay remaining {money(due)}</Text>
              )}
            </Pressable>
          ) : null}
        </Section>

        <Section title="Extra features">
          <AddonsSection
            addons={data.addons}
            canAdd={data.status !== "cancelled"}
            create={edits.createAddon}
            update={edits.updateAddon}
            remove={edits.deleteAddon}
            accept={edits.acceptAddon}
          />
        </Section>

        {data.features.some((f) => f.isIncluded) ? (
          <Section title="Included features">
            <View className="rounded-2xl border border-gray-100 p-4">
              {data.features
                .filter((f) => f.isIncluded)
                .map((f) => (
                  <View key={f.featureId} className="flex-row justify-between py-1.5">
                    <Text className="text-gray-600 flex-1 pr-3">{f.featureName}</Text>
                    <Text className="text-green-700 font-medium">Included</Text>
                  </View>
                ))}
            </View>
          </Section>
        ) : null}

        {data.features.some((f) => !f.isIncluded) ? (
          <Section title="Paid features (original request)">
            <View className="rounded-2xl border border-gray-100 p-4">
              {data.features
                .filter((f) => !f.isIncluded)
                .map((f) => (
                  <View key={f.featureId} className="flex-row justify-between py-1.5">
                    <Text className="text-gray-600 flex-1 pr-3">{f.featureName}</Text>
                    <Text className="text-gray-900">{f.featurePrice > 0 ? rupees(f.featurePrice) : "Free"}</Text>
                  </View>
                ))}
            </View>
          </Section>
        ) : null}

        {data.customRequirements.length > 0 ? (
          <Section title="Custom requirements">
            {data.customRequirements.map((r, i) => (
              <View key={`${r.text}-${i}`} className="flex-row items-start py-1">
                <Ionicons name="ellipse" size={6} color="#9CA3AF" style={{ marginTop: 7 }} />
                <Text className="text-gray-600 ml-2 flex-1">{r.text}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {data.projectImagePath || data.referenceFiles.length > 0 ? (
          <Section title="Attachments">
            {data.projectImagePath ? (
              <Pressable
                onPress={() => openStorage(data.projectImagePath as string, "uploads")}
                className="flex-row items-center rounded-xl border border-gray-100 px-3 py-3 mb-2"
              >
                <Ionicons name="image-outline" size={18} color="#6B7280" />
                <Text className="text-gray-700 ml-2.5 flex-1">Project image</Text>
                {openingPath === data.projectImagePath ? (
                  <ActivityIndicator color="#4F39F6" />
                ) : (
                  <Ionicons name="open-outline" size={16} color="#9CA3AF" />
                )}
              </Pressable>
            ) : null}
            {data.referenceFiles.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => openStorage(f.storagePath, "uploads")}
                className="flex-row items-center rounded-xl border border-gray-100 px-3 py-3 mb-2"
              >
                <Ionicons name="document-attach-outline" size={18} color="#6B7280" />
                <View className="flex-1 ml-2.5">
                  <Text className="text-gray-700" numberOfLines={1}>
                    {f.fileName || f.label}
                  </Text>
                  <Text className="text-gray-400 text-xs">{f.sizeMb.toFixed(2)} MB</Text>
                </View>
                {openingPath === f.storagePath ? (
                  <ActivityIndicator color="#4F39F6" />
                ) : (
                  <Ionicons name="open-outline" size={16} color="#9CA3AF" />
                )}
              </Pressable>
            ))}
          </Section>
        ) : null}

        {data.delivery ? (
          <Section title="Delivery">
            {due > 0 ? (
              <View className="flex-row items-center justify-between rounded-xl bg-amber-50 px-3 py-2 mb-3">
                <Text className="text-amber-800 text-xs font-semibold">Balance due · {money(due)}</Text>
              </View>
            ) : null}
            {data.delivery.notes ? (
              <Text className="text-gray-600 mb-3">{data.delivery.notes}</Text>
            ) : null}
            {data.delivery.demoUrl ? (
              <Pressable
                onPress={() => Linking.openURL(data.delivery!.demoUrl as string)}
                className="flex-row items-center rounded-xl px-3 py-3 mb-2"
                style={{ backgroundColor: "#EEF0FF" }}
              >
                <Ionicons name="play-circle-outline" size={18} color="#4F39F6" />
                <Text className="text-primary font-medium ml-2 flex-1">Open live demo</Text>
                <Ionicons name="open-outline" size={16} color="#4F39F6" />
              </Pressable>
            ) : null}
            {data.delivery.assets.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => openStorage(a.storagePath, "deliveries")}
                className="flex-row items-center rounded-xl border border-gray-100 px-3 py-3 mb-2"
              >
                <Ionicons name="cloud-download-outline" size={18} color="#16A34A" />
                <View className="flex-1 ml-2.5">
                  <Text className="text-gray-800" numberOfLines={1}>
                    {a.label || a.fileName}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {a.kind.replace("_", " ")}
                    {a.sizeMb ? ` · ${a.sizeMb.toFixed(2)} MB` : ""}
                  </Text>
                </View>
                {openingPath === a.storagePath ? (
                  <ActivityIndicator color="#4F39F6" />
                ) : (
                  <Ionicons name="download-outline" size={16} color="#9CA3AF" />
                )}
              </Pressable>
            ))}
            {canPay ? (
              <Pressable
                onPress={handlePayBalance}
                disabled={isPayingBalance}
                className="mt-2 rounded-xl py-3 items-center flex-row justify-center"
                style={{ backgroundColor: "#4F39F6", opacity: isPayingBalance ? 0.6 : 1 }}
              >
                {isPayingBalance ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Pay remaining {money(due)}</Text>
                )}
              </Pressable>
            ) : null}
          </Section>
        ) : null}

        <Section title="Activity">
          <View className="rounded-2xl border border-gray-100 p-4">
            {data.timeline.length === 0 ? (
              <Text className="text-gray-400">No activity yet.</Text>
            ) : (
              data.timeline.map((t, i) => (
                <View key={`${t.newStatus}-${i}`} className="flex-row items-start py-1.5">
                  <Ionicons name="ellipse" size={7} color="#4F39F6" style={{ marginTop: 6 }} />
                  <View className="ml-2.5 flex-1">
                    <Text className="text-gray-700">
                      {ACTIVITY_LABEL[t.newStatus] ?? `Status: ${t.newStatus}`}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(t.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Section>

        <Section title="Messages">
          {data.messages.length === 0 ? (
            <Text className="text-gray-400 mb-2">No messages yet. Ask the team anything about your project.</Text>
          ) : (
            data.messages.map((m) => (
              <View
                key={m.id}
                className={`rounded-2xl px-3.5 py-2.5 mb-2 max-w-[85%] ${
                  m.senderRole === "student" ? "self-end" : "self-start"
                }`}
                style={{ backgroundColor: m.senderRole === "student" ? "#EEF0FF" : "#F3F4F6" }}
              >
                <Text className="text-gray-800">{m.body}</Text>
                <Text className="text-gray-400 text-[10px] mt-1">
                  {m.senderRole === "student" ? "You" : "Team"} ·{" "}
                  {new Date(m.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
          <View className="flex-row items-center mt-2">
            <TextInput
              value={msg}
              onChangeText={setMsg}
              placeholder="Write a message"
              placeholderTextColor="#9CA3AF"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 text-base text-gray-900"
              style={{ height: 46 }}
            />
            <Pressable
              onPress={send}
              disabled={sendMessage.isPending}
              className="ml-2 w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#4F39F6" }}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </Section>
      </ScrollView>
      {editable ? (
        <EditRequestSheet
          visible={editing}
          onClose={() => setEditing(false)}
          detail={data}
          updateRequest={edits.updateRequest}
          addAttachment={edits.addAttachment}
          removeAttachment={edits.removeAttachment}
        />
      ) : null}
    </Screen>
  );
}

export default CustomProjectDetailScreen;
