"use server";

import { z } from "zod";
import { validationError } from "@/lib/validation";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

// Mirror of customProjects.service.sendMessage() — custom_project_messages has
// an RLS insert policy (`cpm_insert_own`) that already forces
// sender_id = auth.uid(), sender_role = 'student' and request ownership. This
// action adds server-side shape/length validation on top and re-checks
// ownership for a friendlier error than a bare RLS rejection.

const messageSchema = z.object({
  requestId: z.guid(),
  body: z.string().trim().min(1, "Write a message first.").max(4000, "That message is too long."),
});

export type SendMessageInput = z.infer<typeof messageSchema>;

export async function sendCustomProjectMessageAction(
  input: SendMessageInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = messageSchema.safeParse(input, { error: validationError });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  const { requestId, body } = parsed.data;

  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again to send a message." };

  const supabase = await createAuthedServerSupabase();

  const { data: owned, error: ownErr } = await supabase
    .from("custom_project_requests")
    .select("id")
    .eq("id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownErr || !owned) return { error: "That request could not be found." };

  const { error } = await supabase.from("custom_project_messages").insert({
    request_id: requestId,
    sender_id: user.id,
    sender_role: "student",
    body,
  });
  if (error) return { error: "Could not send your message. Please try again." };

  return { ok: true };
}

// --- request edits + add-ons (migration 0128) ---------------------------------------------
// Every rule (ownership, "editable only while new", no price fields, add-on state machine) is enforced by
// the SECURITY DEFINER RPCs; these actions only validate shape and translate errors.

type ActionResult = { ok: true } | { error: string };

function rpcError(error: { code?: string; message?: string } | null, fallback: string): ActionResult {
  // P0001 = our own RAISE EXCEPTION messages, 42501 = our permission messages; anything else stays generic.
  if (error && (error.code === "P0001" || error.code === "42501") && error.message) return { error: error.message };
  return { error: fallback };
}

async function signedInClient() {
  const user = await getOptionalUser();
  if (!user) return null;
  return await createAuthedServerSupabase();
}

const requestEditSchema = z.object({
  requestId: z.guid(),
  changes: z
    .object({
      title: z.string().trim().min(1, "Title is required.").max(200),
      objective: z.string().max(5000),
      problem_statement: z.string().max(5000),
      description: z.string().max(10000),
      target_users: z.string().max(2000),
      technology_preference: z.string().max(500),
      custom_requirements: z.array(z.string().max(500, "Each requirement can be at most 500 characters.")).max(30),
      deadline: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid deadline.")
        .nullable(),
    })
    .partial()
    .strict(),
});

export async function updateCustomProjectRequestAction(input: z.infer<typeof requestEditSchema>): Promise<ActionResult> {
  const parsed = requestEditSchema.safeParse(input, { error: validationError });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid changes." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { custom_requirements, ...rest } = parsed.data.changes;
  const changes = {
    ...rest,
    ...(custom_requirements ? { custom_requirements: custom_requirements.map((text) => ({ text })) } : {}),
  };
  const { error } = await supabase.rpc("custom_project_update_request", {
    p_request_id: parsed.data.requestId,
    p_changes: changes,
  });
  return error ? rpcError(error, "Could not save your changes. Please try again.") : { ok: true };
}

const attachmentSchema = z.object({
  requestId: z.guid(),
  path: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  sizeMb: z.number().min(0).max(100),
});

export async function addCustomProjectAttachmentAction(input: z.infer<typeof attachmentSchema>): Promise<ActionResult> {
  const parsed = attachmentSchema.safeParse(input, { error: validationError });
  if (!parsed.success) return { error: "Invalid file." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { error } = await supabase.rpc("custom_project_add_attachment", {
    p_request_id: parsed.data.requestId,
    p_storage_path: parsed.data.path,
    p_file_name: parsed.data.fileName,
    p_size_mb: parsed.data.sizeMb,
    p_label: "",
  });
  return error ? rpcError(error, "Could not attach that file.") : { ok: true };
}

export async function removeCustomProjectAttachmentAction(input: { fileId: string }): Promise<ActionResult> {
  const parsed = z.object({ fileId: z.guid() }).safeParse(input, { error: validationError });
  if (!parsed.success) return { error: "Invalid file." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { data: path, error } = await supabase.rpc("custom_project_remove_attachment", { p_file_id: parsed.data.fileId });
  if (error) return rpcError(error, "Could not remove that file.");
  // best effort: the object lives in the owner's own folder (cp_uploads_owner_all)
  if (typeof path === "string" && path) await supabase.storage.from("custom-project-uploads").remove([path]);
  return { ok: true };
}

const addonSchema = z.object({
  title: z.string().trim().min(1, "Give the extra feature a title.").max(200, "Title is too long."),
  description: z.string().trim().max(5000, "Description is too long."),
});

export async function createCustomProjectAddonAction(
  input: { requestId: string } & z.infer<typeof addonSchema>,
): Promise<ActionResult> {
  const parsed = addonSchema.extend({ requestId: z.guid() }).safeParse(input, { error: validationError });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid extra feature." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { error } = await supabase.rpc("custom_project_addon_create", {
    p_project_id: parsed.data.requestId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
  });
  return error ? rpcError(error, "Could not add that extra feature.") : { ok: true };
}

export async function updateCustomProjectAddonAction(
  input: { addonId: string } & z.infer<typeof addonSchema>,
): Promise<ActionResult> {
  const parsed = addonSchema.extend({ addonId: z.guid() }).safeParse(input, { error: validationError });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid extra feature." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { error } = await supabase.rpc("custom_project_addon_update", {
    p_addon_id: parsed.data.addonId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
  });
  return error ? rpcError(error, "Could not save that extra feature.") : { ok: true };
}

export async function deleteCustomProjectAddonAction(input: { addonId: string }): Promise<ActionResult> {
  const parsed = z.object({ addonId: z.guid() }).safeParse(input, { error: validationError });
  if (!parsed.success) return { error: "Invalid extra feature." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { error } = await supabase.rpc("custom_project_addon_delete", { p_addon_id: parsed.data.addonId });
  return error ? rpcError(error, "Could not delete that extra feature.") : { ok: true };
}

export async function acceptCustomProjectAddonAction(input: { addonId: string }): Promise<ActionResult> {
  const parsed = z.object({ addonId: z.guid() }).safeParse(input, { error: validationError });
  if (!parsed.success) return { error: "Invalid extra feature." };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Please sign in again." };
  const { error } = await supabase.rpc("custom_project_addon_accept", { p_addon_id: parsed.data.addonId });
  return error ? rpcError(error, "Could not accept that extra feature.") : { ok: true };
}
