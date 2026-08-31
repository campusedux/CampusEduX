"use server";

import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

// Mirror of customProjects.service.sendMessage() — custom_project_messages has
// an RLS insert policy (`cpm_insert_own`) that already forces
// sender_id = auth.uid(), sender_role = 'student' and request ownership. This
// action adds server-side shape/length validation on top and re-checks
// ownership for a friendlier error than a bare RLS rejection.

const messageSchema = z.object({
  requestId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a message first.").max(4000, "That message is too long."),
});

export type SendMessageInput = z.infer<typeof messageSchema>;

export async function sendCustomProjectMessageAction(
  input: SendMessageInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  const { requestId, body } = parsed.data;

  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again to send a message." };

  const supabase = createAuthedServerSupabase();

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
