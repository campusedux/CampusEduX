import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Badge, Button, type BadgeTone } from "@/components/ui";
import { confirmAction, notify } from "@/lib/notify";
import type { CustomAddonStatus, CustomProjectAddon } from "@/types";
import { money } from "./format";

const LABEL: Record<CustomAddonStatus, string> = {
  pending: "Waiting for price",
  priced: "Priced — awaiting your OK",
  accepted: "Accepted",
  rejected: "Not accepted",
};
const TONE: Record<CustomAddonStatus, BadgeTone> = {
  pending: "neutral",
  priced: "warning",
  accepted: "success",
  rejected: "danger",
};

type Mutation<T> = { mutateAsync: (v: T) => Promise<unknown>; isPending: boolean };

function AddonForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; description: string };
  submitLabel: string;
  busy: boolean;
  onSubmit: (v: { title: string; description: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  return (
    <View className="rounded-xl border border-gray-200 bg-gray-50 p-3 mb-2">
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Feature (e.g. Push notifications)"
        placeholderTextColor="#9CA3AF"
        maxLength={200}
        accessibilityLabel="Extra feature title"
        className="rounded-xl border border-gray-200 bg-white px-3 text-gray-900"
        style={{ height: 46 }}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What should it do? The team will price it."
        placeholderTextColor="#9CA3AF"
        maxLength={5000}
        multiline
        accessibilityLabel="Extra feature details"
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 mt-2"
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />
      <View className="flex-row justify-end mt-2" style={{ gap: 8 }}>
        <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} disabled={busy} />
        <Button
          label={submitLabel}
          size="sm"
          loading={busy}
          onPress={async () => {
            if (!title.trim()) {
              notify("Add a title", "Give the extra feature a short title.");
              return;
            }
            if (await onSubmit({ title: title.trim(), description: description.trim() })) onCancel();
          }}
        />
      </View>
    </View>
  );
}

/**
 * Extra features, kept separate from the original request: the owner adds them (no price), the team
 * prices them, the owner accepts. Only accepted prices count toward the project value (enforced in the DB).
 */
export function AddonsSection({
  addons,
  canAdd,
  create,
  update,
  remove,
  accept,
}: {
  addons: CustomProjectAddon[];
  canAdd: boolean;
  create: Mutation<{ title: string; description: string }>;
  update: Mutation<{ addonId: string; title: string; description: string }>;
  remove: Mutation<string>;
  accept: Mutation<string>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const run = async (p: Promise<unknown>, success: string) => {
    try {
      await p;
      notify(success);
      return true;
    } catch (e) {
      notify("Something went wrong", e instanceof Error ? e.message : "Please try again.");
      return false;
    }
  };

  return (
    <View>
      {addons.length === 0 && !adding ? (
        <Text className="text-gray-500 mb-2">Need something that wasn&apos;t in the original request? Add it as an extra feature.</Text>
      ) : null}

      {addons.map((a) =>
        editingId === a.id ? (
          <AddonForm
            key={a.id}
            initial={{ title: a.title, description: a.description }}
            submitLabel="Save"
            busy={update.isPending}
            onCancel={() => setEditingId(null)}
            onSubmit={(v) => run(update.mutateAsync({ addonId: a.id, ...v }), "Extra feature updated")}
          />
        ) : (
          <View key={a.id} className="rounded-xl border border-gray-100 p-3 mb-2">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-gray-900">{a.title}</Text>
                {a.description ? <Text className="text-gray-500 text-xs mt-0.5">{a.description}</Text> : null}
              </View>
              <Text className="font-bold text-gray-900">{a.price != null ? money(a.price) : "Price pending"}</Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Badge label={LABEL[a.status]} tone={TONE[a.status]} size="sm" />
              <View className="flex-row" style={{ gap: 6 }}>
                {a.status === "priced" ? (
                  <Button
                    label={`Accept ${a.price != null ? money(a.price) : ""}`}
                    size="sm"
                    loading={accept.isPending}
                    onPress={() => run(accept.mutateAsync(a.id), "Extra feature accepted")}
                  />
                ) : null}
                {a.status === "pending" ? (
                  <>
                    <Pressable onPress={() => setEditingId(a.id)} accessibilityRole="button" accessibilityLabel={`Edit ${a.title}`} className="px-2 py-2">
                      <Text className="text-primary font-semibold">Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${a.title}`}
                      className="px-2 py-2"
                      onPress={() =>
                        confirmAction("Delete extra feature?", a.title, () => run(remove.mutateAsync(a.id), "Extra feature deleted"), "Delete")
                      }
                    >
                      <Text className="font-semibold" style={{ color: "#DC2626" }}>
                        Delete
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        )
      )}

      {canAdd ? (
        adding ? (
          <AddonForm
            submitLabel="Send for pricing"
            busy={create.isPending}
            onCancel={() => setAdding(false)}
            onSubmit={(v) => run(create.mutateAsync(v), "Sent for pricing")}
          />
        ) : (
          <Button label="Add extra feature" variant="outline" size="sm" leftIcon="add" onPress={() => setAdding(true)} />
        )
      ) : null}
    </View>
  );
}

export default AddonsSection;
