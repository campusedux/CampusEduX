import { supabase } from "@/lib/supabase";

export const appConfigService = {
  /**
   * site_settings.min_supported_app_version (migration 0129/100; public SELECT). Returns null on any
   * error — including the column not existing yet — so a failed read never locks anyone out.
   */
  async getMinSupportedVersion(): Promise<string | null> {
    const { data, error } = await supabase
      .from("site_settings")
      .select("min_supported_app_version")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    const v = (data as { min_supported_app_version?: unknown }).min_supported_app_version;
    return typeof v === "string" ? v : null;
  },
};
