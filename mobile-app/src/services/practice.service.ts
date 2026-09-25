import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants/brand";
import { describeRunFailure } from "@/lib/runFailure";
import type {
  CodingSubmissionDetail,
  CodingSubmissionRow,
  CompilerRun,
  InterviewCategory,
  InterviewTopicDetail,
  InterviewTopicsPage,
  JudgeResponse,
  PracticeCategory,
  PracticeProblemDetail,
  PracticeProblemsPage,
  PracticeProblemsQuery,
  SubmitResponse,
} from "@/types/practice.types";
import { PRACTICE_PAGE_SIZE } from "@/types/practice.types";

/**
 * Practice read layer + code-execution client.
 *
 * Reads go through the same SECURITY DEFINER RPCs the website uses, pinned to
 * `'mobile'` (published + show_on_mobile + academic targeting + premium gate are
 * enforced in the database; hidden test cases are never returned).
 *
 * Running / judging / submitting code goes through the website's API routes with
 * the user's Supabase access token as a Bearer header — the app never holds a
 * compiler provider key, and verdicts are always decided server-side.
 */

const PLATFORM = "mobile";
const API_BASE = BRAND.website.replace(/\/$/, "");
const API_TIMEOUT_MS = 90_000;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Error surfaced by the execution routes; `kind` lets screens pick the right UI. */
export class PracticeApiError extends Error {
  constructor(
    message: string,
    readonly kind: "rate_limit" | "auth" | "network" | "server",
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "PracticeApiError";
  }
}

async function callApi<T>(path: string, body: unknown, opts: { requireAuth?: boolean } = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token && opts.requireAuth) throw new PracticeApiError("Your session expired — sign in again.", "auth");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new PracticeApiError("Couldn't reach the server. Check your connection and try again.", "network");
  } finally {
    clearTimeout(timer);
  }

  const json = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 429 || res.status >= 500) {
    const f = describeRunFailure(res.status, json, res.headers.get("Retry-After"));
    throw new PracticeApiError(f.message, f.kind, f.retryAfter);
  }
  if (!res.ok || json?.ok === false) {
    throw new PracticeApiError(describeRunFailure(res.status, json).message, "server");
  }
  return json as T;
}

export const practiceService = {
  // --- coding problems ---------------------------------------------------
  async listCategories(): Promise<PracticeCategory[]> {
    const res = await supabase.rpc("practice_categories", { p_platform: PLATFORM });
    return unwrap<PracticeCategory[] | null>(res) ?? [];
  },

  async listProblems(query: PracticeProblemsQuery, page: number): Promise<PracticeProblemsPage> {
    const res = await supabase.rpc("practice_problems_list", {
      p_platform: PLATFORM,
      p_difficulty: query.difficulty ?? null,
      p_category: query.category ?? null,
      p_search: query.q?.trim() ? query.q.trim().slice(0, 80) : null,
      p_limit: PRACTICE_PAGE_SIZE,
      p_offset: page * PRACTICE_PAGE_SIZE,
    });
    const data = unwrap<PracticeProblemsPage | null>(res);
    return data && Array.isArray(data.items) ? data : { total: 0, items: [] };
  },

  async getProblem(slug: string): Promise<PracticeProblemDetail | null> {
    const res = await supabase.rpc("practice_problem_detail", { p_slug: slug, p_platform: PLATFORM });
    return unwrap<PracticeProblemDetail | null>(res) ?? null;
  },

  // --- execution (website API routes, Bearer auth) -----------------------
  async run(input: { language: string; source: string; stdin: string }): Promise<CompilerRun> {
    const json = await callApi<{ run: CompilerRun }>("/api/compiler/run", input);
    return json.run;
  },

  judge(input: { slug: string; language: string; source: string }): Promise<JudgeResponse> {
    return callApi<JudgeResponse>("/api/practice/judge", input);
  },

  submit(input: { slug: string; language: string; source: string }): Promise<SubmitResponse> {
    return callApi<SubmitResponse>("/api/practice/submit", input, { requireAuth: true });
  },

  // --- submissions (own rows via RLS) ------------------------------------
  async listSubmissions(userId: string, page: number): Promise<{ rows: CodingSubmissionRow[]; total: number }> {
    const from = page * PRACTICE_PAGE_SIZE;
    const { data, error, count } = await supabase
      .from("coding_submissions")
      .select("id,problem_slug,language,verdict,passed,total,runtime_ms,memory_kb,created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, from + PRACTICE_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as CodingSubmissionRow[], total: count ?? 0 };
  },

  /** Full row incl. `source_code`; `null` if it isn't the caller's (RLS) or is gone. */
  async getSubmission(id: string): Promise<CodingSubmissionDetail | null> {
    const { data, error } = await supabase
      .from("coding_submissions")
      .select("id,problem_slug,language,verdict,passed,total,runtime_ms,memory_kb,created_at,source_code")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as CodingSubmissionDetail | null) ?? null;
  },

  // --- interview questions -----------------------------------------------
  async listInterviewCategories(): Promise<InterviewCategory[]> {
    const res = await supabase.rpc("interview_categories_list", { p_platform: PLATFORM });
    return unwrap<InterviewCategory[] | null>(res) ?? [];
  },

  async listInterviewTopics(categorySlug: string): Promise<InterviewTopicsPage | null> {
    const res = await supabase.rpc("interview_topics_list", { p_category_slug: categorySlug, p_platform: PLATFORM });
    return unwrap<InterviewTopicsPage | null>(res) ?? null;
  },

  async getInterviewTopic(categorySlug: string, topicSlug: string): Promise<InterviewTopicDetail | null> {
    const res = await supabase.rpc("interview_topic_detail", {
      p_category_slug: categorySlug,
      p_topic_slug: topicSlug,
      p_platform: PLATFORM,
    });
    return unwrap<InterviewTopicDetail | null>(res) ?? null;
  },
};
