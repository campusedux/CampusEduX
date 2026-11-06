import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cachedPublicRead, RpcFailed } from "@/lib/publicCache";
import { CONTENT_LEAF_REVALIDATE, CONTENT_SHARED_REVALIDATE, interviewTag } from "@/lib/learningTags";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { InterviewCategory, InterviewTopicsPage, InterviewTopicDetail } from "@/lib/interviewQuestions.types";

export type {
  InterviewCategory,
  InterviewTopicSummary,
  InterviewTopicsPage,
  InterviewQuestion,
  InterviewTopicDetail,
} from "@/lib/interviewQuestions.types";

/**
 * Read layer for Practice → Interview Questions. Everything goes through the
 * SECURITY DEFINER RPCs from migration 0103/075 (`interview_categories_list`,
 * `interview_topics_list`, `interview_topic_detail`,
 * `interview_questions_sitemap`), pinned to the `'website'` platform. Those
 * functions enforce published + `show_on_website` and never expose draft /
 * unpublished rows. Mirrors `src/lib/practice.ts`.
 */

const PLATFORM = "website";

/** All published interview categories (languages) + a live topic count.
 *  Cross-request cached (tag `interview-questions`, refreshed by
 *  `POST /api/revalidate`). */
export const getInterviewCategories = unstable_cache(
  async (): Promise<InterviewCategory[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) throw new RpcFailed("Interview categories are unavailable");
    const { data, error } = await supabase.rpc("interview_categories_list", { p_platform: PLATFORM });
    if (error || !Array.isArray(data)) throw new RpcFailed("Interview categories are unavailable");
    return data as InterviewCategory[];
  },
  ["interview-categories"],
  { revalidate: CONTENT_SHARED_REVALIDATE, tags: ["interview-questions"] },
);

/** Topic grid for one category (e.g. `java`) — `null` when the category
 *  doesn't exist or isn't published, so the caller can 404. */
export const getInterviewTopics = cache(async (categorySlug: string): Promise<InterviewTopicsPage | null> =>
  unstable_cache(
    async (cat): Promise<InterviewTopicsPage | null> => {
      const supabase = getPublicSupabase();
      if (!supabase) throw new RpcFailed("Interview topics are unavailable");
      const { data, error } = await supabase.rpc("interview_topics_list", {
        p_category_slug: cat,
        p_platform: PLATFORM,
      });
      if (error) throw new RpcFailed();
      return (data || null) as InterviewTopicsPage | null;
    },
    ["interview:topics", categorySlug],
    { revalidate: CONTENT_SHARED_REVALIDATE, tags: ["interview-questions", interviewTag.category(categorySlug)] },
  )(categorySlug),
);

/** One topic page — every published question in order, plus prev/next topic
 *  within the same category. `null` when the category/topic doesn't exist or
 *  isn't published. Also tagged with its category: prev/next links mean a
 *  sibling change can alter this page. */
export const getInterviewTopicDetail = cache(
  async (categorySlug: string, topicSlug: string): Promise<InterviewTopicDetail | null> =>
    cachedPublicRead(
      "interview:topic",
      [categorySlug, topicSlug],
      ["interview-questions", interviewTag.category(categorySlug), interviewTag.topic(categorySlug, topicSlug)],
      CONTENT_LEAF_REVALIDATE,
      async (cat, topic): Promise<InterviewTopicDetail | null> => {
        const supabase = getPublicSupabase();
        if (!supabase) return null;
        const { data, error } = await supabase.rpc("interview_topic_detail", {
          p_category_slug: cat,
          p_topic_slug: topic,
          p_platform: PLATFORM,
        });
        if (error) throw new RpcFailed();
        return (data || null) as InterviewTopicDetail | null;
      },
      null,
    ),
);

/** Published, website-visible topic slugs + last-modified, for `sitemap.ts`. */
export const getInterviewQuestionsSitemap = unstable_cache(
  async (): Promise<{ category_slug: string; topic_slug: string; updated_at: string }[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("interview_questions_sitemap", { p_platform: PLATFORM });
    if (!Array.isArray(data)) return [];
    return data as { category_slug: string; topic_slug: string; updated_at: string }[];
  },
  ["interview-questions-slugs"],
  { revalidate: CONTENT_SHARED_REVALIDATE, tags: ["interview-questions"] },
);
