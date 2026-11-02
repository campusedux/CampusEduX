"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

// The /contact form. All work happens in the DB function
// submit_contact_message() (website/supabase/migrations/0001) — it validates,
// rate-limits (4/hour/client key) and is the only thing allowed to write
// contact_submissions. This action adds a first-line Zod check for friendly
// messages and derives the rate-limit key from the request.

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120, "That name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail.")
    .max(5000, "That message is too long (5000 characters max)."),
});

export type ContactInput = z.infer<typeof schema>;

export async function submitContactMessageAction(input: ContactInput): Promise<{ ok: true } | { error: string }> {
  const parsed = schema.safeParse(input, { error: validationError });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };

  const h = await headers();
  const forwarded = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ip = forwarded || h.get("x-real-ip") || "";
  const clientKey = ip ? `ip:${ip}` : `ua:${(h.get("user-agent") ?? "unknown").slice(0, 100)}`;

  // Uses the signed-in session when present (records user_id), anon otherwise.
  const supabase = await createAuthedServerSupabase();

  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_message: parsed.data.message,
    p_client_key: clientKey,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("RATE_LIMITED")) {
      return { error: "You've sent a few messages recently. Please try again in a little while." };
    }
    if (msg.includes("INVALID_")) {
      return { error: "Please check the details and try again." };
    }
    if (msg.includes("submit_contact_message") || msg.includes("does not exist")) {
      return { error: "The contact form isn't available yet. Please email us directly for now." };
    }
    return { error: "Could not send your message. Please try again." };
  }

  return { ok: true };
}
