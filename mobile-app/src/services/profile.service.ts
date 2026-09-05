import { supabase } from "@/lib/supabase";
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

  async uploadAvatar(userId: string, fileUri: string): Promise<string> {
    const path = `${userId}/avatar_${Date.now()}.jpg`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, {
      contentType: "image/jpeg",
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
