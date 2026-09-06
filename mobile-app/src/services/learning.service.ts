import { supabase } from "@/lib/supabase";
import type {
  CodingProblemDetail,
  LearningGridCard,
  LearningSearchHit,
  LearningTopicPage,
  LearningTree,
  TopicPractice,
} from "@/types";

/**
 * Learning read layer for the mobile app. Everything goes through
 * the SECURITY DEFINER RPCs from migration 0042 / 019, pinned to `'mobile'`:
 *
 *   learning_grids_list('mobile')
 *   learning_tree(gridSlug, 'mobile')
 *   learning_topic_content(gridSlug, topicSlug, 'mobile')   -> `locked` + prev/next
 *   learning_search(q, 'mobile', limit)
 *
 * Those functions enforce the full published + show_on_mobile chain and the
 * premium gate, so a locked topic's body is never delivered to the client.
 *
 * There is NO sample-data fallback. On failure these throw and the screens
 * render a proper error + retry state (spec: no fake content in production).
 */

const PLATFORM = "mobile";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const learningService = {
  async listGrids(): Promise<LearningGridCard[]> {
    const res = await supabase.rpc("learning_grids_list", { p_platform: PLATFORM });
    const data = unwrap<LearningGridCard[] | null>(res);
    return Array.isArray(data) ? data : [];
  },

  async getTree(gridSlug: string): Promise<LearningTree | null> {
    const res = await supabase.rpc("learning_tree", { p_grid_slug: gridSlug, p_platform: PLATFORM });
    return unwrap<LearningTree | null>(res);
  },

  async getTopic(gridSlug: string, topicSlug: string): Promise<LearningTopicPage | null> {
    const res = await supabase.rpc("learning_topic_content", {
      p_grid_slug: gridSlug,
      p_topic_slug: topicSlug,
      p_platform: PLATFORM,
    });
    return unwrap<LearningTopicPage | null>(res);
  },

  async search(q: string, limit = 20): Promise<LearningSearchHit[]> {
    const term = q.trim();
    if (!term) return [];
    const res = await supabase.rpc("learning_search", { p_q: term, p_platform: PLATFORM, p_limit: limit });
    const data = unwrap<LearningSearchHit[] | null>(res);
    return Array.isArray(data) ? data : [];
  },

  // --- topic-specific practice (migration 0048/025) ----------------------
  /** Mock Tests + Coding Problems attached to one topic. `learning_topic_practice`
   *  enforces the same publish + platform + targeting chain as the topic RPC and
   *  only returns rows for this exact topic. Empty arrays for a topic with none. */
  async getTopicPractice(gridSlug: string, topicSlug: string): Promise<TopicPractice> {
    const res = await supabase.rpc("learning_topic_practice", {
      p_grid_slug: gridSlug,
      p_topic_slug: topicSlug,
      p_platform: PLATFORM,
    });
    const data = unwrap<Partial<TopicPractice> | null>(res);
    return {
      mock_tests: Array.isArray(data?.mock_tests) ? data!.mock_tests : [],
      coding_problems: Array.isArray(data?.coding_problems) ? data!.coding_problems : [],
    };
  },

  /** One topic Coding Problem, read-only, by its global slug. `coding_problem_detail`
   *  withholds the body / editorial when the caller can't open a premium problem
   *  (`locked: true`) and never returns the hidden judge test cases. */
  async getCodingProblem(slug: string): Promise<CodingProblemDetail | null> {
    const res = await supabase.rpc("coding_problem_detail", { p_slug: slug, p_platform: PLATFORM });
    return unwrap<CodingProblemDetail | null>(res);
  },

  // --- bookmarks (learning_bookmarks — own rows via RLS) -------------------
  async listBookmarkedTopicIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from("learning_bookmarks")
      .select("topic_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return new Set((data ?? []).map((r: { topic_id: string }) => r.topic_id));
  },

  async setBookmark(userId: string, topicId: string, shouldBookmark: boolean): Promise<void> {
    if (shouldBookmark) {
      const { error } = await supabase
        .from("learning_bookmarks")
        .upsert({ user_id: userId, topic_id: topicId }, { onConflict: "user_id,topic_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("learning_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("topic_id", topicId);
      if (error) throw new Error(error.message);
    }
  },
};
