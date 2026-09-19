import { supabase } from "@/lib/supabase";
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, extensionForImageMime, readFileBody, resolveContentType } from "@/lib/uploadMime";
import type { ProfileEditableFields, PurchaseHistoryItem } from "@/types";

export const profileService = {
  async updateProfile(userId: string, fields: ProfileEditableFields): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fields.fullName,
        mobile_number: fields.mobileNumber,
        date_of_birth: fields.dateOfBirth,
        gender: fields.gender,
        location: fields.location,
        avatar_url: fields.avatarUrl,
        linkedin_url: fields.linkedinUrl,
        github_url: fields.githubUrl,
        portfolio_url: fields.portfolioUrl,
      })
      .eq("id", userId);
    if (error) throw new Error(`Couldn't save your profile: ${error.message}`);
  },

  /**
   * Uploads the avatar. The `avatars` bucket only accepts jpeg/png/webp up to 2 MB (0117/089), so the
   * content type is resolved explicitly (picker mime -> extension -> jpeg, the picker's default
   * output at quality < 1) and sent with an ArrayBuffer body.
   */
  async uploadAvatar(userId: string, fileUri: string, mimeType?: string | null): Promise<string> {
    const { body, hintType, size } = await readFileBody(fileUri);
    if (size > AVATAR_MAX_BYTES) throw new Error("That photo is too large. Please choose one under 2MB.");
    const contentType = resolveContentType({ mimeType, uri: fileUri, hintType }, AVATAR_MIME_TYPES) ?? (mimeType ? null : "image/jpeg");
    if (!contentType) throw new Error("Please choose a JPEG, PNG or WebP photo.");
    const path = `${userId}/avatar_${Date.now()}.${extensionForImageMime(contentType)}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, body, {
      contentType,
      upsert: true,
    });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Purchase history currently reflects real project purchases only
   * (Module 3). Course/test purchase types are surfaced as filter tabs to
   * match the mockup, but return empty until those catalog features exist
   * — no fabricated entries.
   *
   * This is real order history: a failed fetch propagates so the screen shows
   * its error state. An empty result is the correct history for a student who
   * hasn't bought anything and is returned as-is.
   */
  async getPurchaseHistory(userId: string): Promise<PurchaseHistoryItem[]> {
    const { data, error } = await supabase
      .from("purchases")
      .select("id, total_amount, status, created_at, project:projects(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: "project" as const,
      title: row.project?.title ?? "Project",
      amount: row.total_amount,
      purchasedAt: row.created_at,
      status: row.status === "success" ? "completed" : row.status,
    }));
  },
};
