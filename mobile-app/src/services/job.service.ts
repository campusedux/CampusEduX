import { supabase } from "@/lib/supabase";
import { rankByAcademicRelevance, hasAcademicSignal, type AcademicProfile } from "@/lib/personalization";
import type {
  Job,
  JobDetail,
  JobFilters,
  Company,
  Recruiter,
  JobApplication,
  ApplicationStage,
  JobAlertPreferences,
  JobCategoryCount,
  JobDashboardStats,
} from "@/types";
import {
  SAMPLE_JOBS,
  SAMPLE_COMPANIES,
  SAMPLE_JOB_ALERT_PREFS,
  sampleJobDetail,
  sampleRecruiter,
  sampleSavedJobs,
  sampleAppliedJobs,
  sampleApplicationDetail,
  sampleResumes,
} from "@/data/sampleJobContent";

const JOB_SELECT = "*, company:companies(name, logo_url)";
const PAGE_SIZE = 20;

/**
 * Returns `run()`'s rows. A real empty result is always returned as-is (an
 * honest empty state) — sample rows are a __DEV__-only stand-in for a genuine
 * query failure, never for "no rows", and never in production (spec: no
 * sample/fake data in production builds).
 */
async function orSample<T>(label: string, run: () => Promise<T[]>, sample: T[]): Promise<T[]> {
  try {
    return await run();
  } catch (error) {
    if (__DEV__) {
      console.info(`[job.service] ${label}: using sample content in dev (${(error as Error).message})`);
      return sample;
    }
    throw error;
  }
}

/**
 * Active = published (`status = 'open'`) and not past its deadline. RLS only
 * checks audience targeting, so drafts / closed jobs must be filtered here.
 */
function activeOnly(builder: any) {
  return builder.eq("status", "open").or(`application_deadline.is.null,application_deadline.gt.${new Date().toISOString()}`);
}

/** Case variants so an exact `skills` array match still hits "react" / "React" / "REACT". */
function skillVariants(term: string): string[] {
  const title = term.replace(/\b\w/g, (c) => c.toUpperCase());
  return Array.from(new Set([term, term.toLowerCase(), term.toUpperCase(), title]));
}

function matchesJobFilters(j: Job, f: Partial<JobFilters>): boolean {
  if (f.jobType && f.jobType !== "All" && j.jobType !== f.jobType) return false;
  if (f.location && !j.location.toLowerCase().includes(f.location.toLowerCase())) return false;
  if (f.query?.trim() && !j.title.toLowerCase().includes(f.query.trim().toLowerCase())) return false;
  return true;
}

function mapJobRow(row: any): Job {
  const postedDate = new Date(row.posted_at ?? row.created_at);
  const daysAgo = Math.max(0, Math.floor((Date.now() - postedDate.getTime()) / 86_400_000));
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    companyName: row.company?.name ?? row.company_name ?? "",
    companyLogoUrl: row.company?.logo_url ?? row.company_logo_url ?? null,
    location: row.location,
    salaryRange: row.salary_range,
    postedAt: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
    jobType: row.job_type ?? "Full Time",
    isNew: daysAgo <= 3,
    category: row.category ?? null,
    workMode: row.work_mode ?? null,
    experienceLevel: row.experience_level ?? null,
    applyUrl: row.apply_url ?? null,
  };
}

function mapCompanyRow(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    website: row.website,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    employeeCount: row.employee_count ?? "",
    about: row.about ?? "",
    openJobsCount: row.open_jobs_count ?? 0,
  };
}

function mapRecruiterRow(row: any): Recruiter {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    companyName: row.company?.name ?? "",
    companyLogoUrl: row.company?.logo_url ?? null,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    email: row.email,
    phone: row.phone,
    location: row.location,
    about: row.about ?? "",
  };
}

function stageStatusOrder(status: ApplicationStage["status"]) {
  return { completed: 0, in_progress: 1, pending: 2 }[status];
}

function applyFilters(builder: any, filters: Partial<JobFilters>) {
  let q = builder;
  // Title, company and skills. Characters that are syntax in a PostgREST
  // filter string are stripped rather than escaped.
  const term = filters.query?.replace(/[%*,()"\\{}]/g, " ").trim();
  if (term) {
    const skills = skillVariants(term).map((v) => `"${v}"`).join(",");
    q = q.or(`title.ilike.%${term}%,company_name.ilike.%${term}%,skills.ov.{${skills}}`);
  }
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.workMode) q = q.eq("work_mode", filters.workMode);
  if (filters.experienceLevel) q = q.eq("experience_level", filters.experienceLevel);
  if (filters.jobType && filters.jobType !== "All") q = q.eq("job_type", filters.jobType);
  if (filters.location) q = q.ilike("location", `%${filters.location}%`);
  // `experience` is freeform text (e.g. "2-4 years"), not a structured range —
  // best-effort substring match, same tier of precision as `location` above.
  if (filters.experience) q = q.ilike("experience", `%${filters.experience}%`);
  if (typeof filters.minSalaryLPA === "number" && filters.minSalaryLPA > 0) q = q.gte("salary_min_lpa", filters.minSalaryLPA);
  if (typeof filters.maxSalaryLPA === "number" && filters.maxSalaryLPA < 50) q = q.lte("salary_max_lpa", filters.maxSalaryLPA);

  switch (filters.sortBy) {
    case "latest":
      return q.order("posted_at", { ascending: false });
    case "salary":
      return q.order("salary_max_lpa", { ascending: false });
    default:
      return q.order("posted_at", { ascending: false });
  }
}

export const jobService = {
  async getAllJobs(
    filters: Partial<JobFilters> = {},
    page = 0,
    academic?: AcademicProfile
  ): Promise<{ jobs: Job[]; hasMore: boolean }> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    try {
      const { data, error } = await applyFilters(activeOnly(supabase.from("jobs").select(JOB_SELECT)), filters).range(from, to);
      if (error) throw new Error(error.message);
      // RLS (migration 0036) has already restricted this page to the student's
      // GLOBAL + Course + Branch jobs — server-side, before pagination (spec §10,
      // §17). Ranking only re-orders what is already authorised (spec §16).
      const ordered = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
      const jobs = ordered.map(mapJobRow);
      // An empty page is a real answer — show the empty state, not unrelated
      // sample jobs (spec §18). Sample stays only for a genuine query failure.
      return { jobs, hasMore: jobs.length === PAGE_SIZE };
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getAllJobs: using sample content in dev (${(error as Error).message})`);
        const jobs = page === 0 ? SAMPLE_JOBS.filter((j) => matchesJobFilters(j, filters)) : [];
        return { jobs, hasMore: false };
      }
      throw error;
    }
  },

  async getRecommendedJobs(userId: string, limit = 15): Promise<Job[]> {
    // Recommends jobs whose academic target matches the student's
    // course / branch / year, keeping general listings as the fallback so the
    // section is never empty (spec §25, §27, §28).
    let academic: AcademicProfile | undefined;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("course, branch, year")
        .eq("id", userId)
        .single();
      if (profile) academic = { course: profile.course, branch: profile.branch, year: profile.year };
    } catch {
      academic = undefined;
    }

    const fetchLimit = academic && hasAcademicSignal(academic) ? Math.max(limit * 3, 30) : limit;
    let data: any[] | null = null;
    try {
      const res = await activeOnly(supabase.from("jobs").select(JOB_SELECT))
        .order("posted_at", { ascending: false })
        .limit(fetchLimit);
      if (res.error) throw new Error(res.error.message);
      data = res.data;
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getRecommendedJobs: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_JOBS.slice(0, limit);
      }
      throw error;
    }

    const ordered = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
    // An empty result is a real answer (no jobs match this student's course/
    // branch/year yet) — show it honestly, never unrelated sample jobs.
    return ordered.slice(0, limit).map(mapJobRow);
  },

  /** Real per-category counts of active jobs (RPC `job_category_counts`, migration 0114). */
  async getCategoryCounts(): Promise<JobCategoryCount[]> {
    const { data, error } = await supabase.rpc("job_category_counts");
    if (!error) {
      return ((data ?? []) as { category: string; job_count: number | string }[]).map((r) => ({
        category: r.category,
        jobCount: Number(r.job_count),
      }));
    }
    // RPC not deployed yet: aggregate the same active rows client-side.
    const res = await activeOnly(supabase.from("jobs").select("category"));
    if (res.error) throw new Error(res.error.message);
    const tally = new Map<string, number>();
    for (const row of (res.data ?? []) as { category: string | null }[]) {
      const key = row.category ?? "Other";
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    return Array.from(tally, ([category, jobCount]) => ({ category, jobCount })).sort((a, b) => b.jobCount - a.jobCount);
  },

  /** Hero stats (RPC `job_dashboard_stats`, migration 0114). */
  async getDashboardStats(): Promise<JobDashboardStats> {
    const { data, error } = await supabase.rpc("job_dashboard_stats");
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row) {
      return { activeJobs: Number(row.active_jobs), companyCount: Number(row.company_count), fresherJobs: Number(row.fresher_jobs) };
    }
    const res = await activeOnly(supabase.from("jobs").select("company_id, company_name"));
    if (res.error) throw new Error(res.error.message);
    const rows = (res.data ?? []) as { company_id: string | null; company_name: string }[];
    const companies = new Set(rows.map((r) => r.company_id ?? r.company_name).filter(Boolean));
    return { activeJobs: rows.length, companyCount: companies.size, fresherJobs: 0 };
  },

  async getCompanies(query = ""): Promise<Company[]> {
    return orSample(
      "getCompanies",
      async () => {
        let q = supabase.from("companies").select("*").order("open_jobs_count", { ascending: false });
        if (query.trim()) q = q.ilike("name", `%${query}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapCompanyRow);
      },
      query.trim()
        ? SAMPLE_COMPANIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
        : SAMPLE_COMPANIES
    );
  },

  async getCompanyDetails(companyId: string): Promise<Company> {
    try {
      const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
      if (error || !data) throw new Error("Company not found.");
      return mapCompanyRow(data);
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getCompanyDetails: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_COMPANIES.find((c) => c.id === companyId) ?? SAMPLE_COMPANIES[0];
      }
      throw error;
    }
  },

  async getCompanyJobs(companyId: string): Promise<Job[]> {
    return orSample(
      "getCompanyJobs",
      async () => {
        const { data, error } = await supabase
          .from("jobs")
          .select(JOB_SELECT)
          .eq("company_id", companyId)
          .order("posted_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapJobRow);
      },
      SAMPLE_JOBS.filter((j) => j.companyId === companyId)
    );
  },

  async getJobDetail(jobId: string, userId?: string): Promise<JobDetail> {
    let row: any = null;
    try {
      const res = await supabase
        .from("jobs")
        .select("*, company:companies(name, logo_url, rating, review_count)")
        .eq("id", jobId)
        .single();
      if (res.error || !res.data) throw new Error("Job not found.");
      row = res.data;
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getJobDetail: using sample content in dev (${(error as Error).message})`);
        return sampleJobDetail(jobId);
      }
      throw error;
    }

    let isSaved = false;
    let hasApplied = false;
    if (userId) {
      const [savedRes, appliedRes] = await Promise.all([
        supabase.from("saved_jobs").select("job_id").eq("job_id", jobId).eq("user_id", userId).maybeSingle(),
        supabase.from("applications").select("id").eq("job_id", jobId).eq("user_id", userId).maybeSingle(),
      ]);
      isSaved = !!savedRes.data;
      hasApplied = !!appliedRes.data;
    }

    return {
      ...mapJobRow(row),
      description: row.description ?? "",
      requirements: row.requirements ?? [],
      skills: row.skills ?? [],
      experience: row.experience ?? "",
      summary: row.summary ?? "",
      responsibilities: row.responsibilities ?? [],
      qualification: row.qualification ?? "",
      shift: row.shift ?? "",
      benefits: row.benefits ?? [],
      category: row.category ?? "",
      requisitionId: row.requisition_id ?? "",
      applyUrl: row.apply_url ?? null,
      applicationDeadline: row.application_deadline ?? null,
      candidateNote: row.candidate_note ?? "",
      companyRating: row.company?.rating ?? 0,
      companyReviewCount: row.company?.review_count ?? 0,
      isSaved,
      hasApplied,
    };
  },

  async getRecruiterForJob(jobId: string): Promise<Recruiter> {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("recruiter:recruiters(*, company:companies(name, logo_url))")
        .eq("id", jobId)
        .single();
      if (error || !data?.recruiter) throw new Error("Recruiter details not available for this job.");
      return mapRecruiterRow(data.recruiter);
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getRecruiterForJob: using sample content in dev (${(error as Error).message})`);
        return sampleRecruiter(jobId);
      }
      throw error;
    }
  },

  async toggleSavedJob(jobId: string, userId: string, isCurrentlySaved: boolean): Promise<void> {
    // A user-triggered write: surface failures instead of pretending it worked.
    if (isCurrentlySaved) {
      const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", userId);
      if (error) throw new Error(`Couldn't remove the saved job: ${error.message}`);
    } else {
      const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: userId });
      if (error) throw new Error(`Couldn't save this job: ${error.message}`);
    }
  },

  async getSavedJobs(userId: string): Promise<Job[]> {
    return orSample(
      "getSavedJobs",
      async () => {
        const { data, error } = await supabase
          .from("saved_jobs")
          .select("job:jobs(*, company:companies(name, logo_url))")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row: any) => mapJobRow(row.job));
      },
      sampleSavedJobs()
    );
  },

  async getResumes(userId: string) {
    return orSample(
      "getResumes",
      async () => {
        const { data, error } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .order("uploaded_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row: any) => ({
          id: row.id,
          fileName: row.file_name,
          fileUrl: row.file_url,
          uploadedAt: row.uploaded_at,
        }));
      },
      sampleResumes()
    );
  },

  async uploadResume(userId: string, fileUri: string, fileName: string): Promise<{ id: string; fileUrl: string }> {
    const path = `${userId}/${Date.now()}_${fileName}`;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, blob, {
      contentType: blob.type || "application/pdf",
      upsert: true,
    });
    if (uploadError) throw new Error(uploadError.message);

    // `resumes` is a PRIVATE bucket (migration 0029) — a signed URL, not a
    // public one, so a resume with personal details isn't world-readable.
    const { data: signed, error: signError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
    if (signError || !signed?.signedUrl) {
      throw new Error(signError?.message ?? "Could not generate a resume link.");
    }

    const { data, error } = await supabase
      .from("resumes")
      .insert({ user_id: userId, file_name: fileName, file_url: signed.signedUrl, storage_path: path })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not save resume.");

    return { id: data.id, fileUrl: signed.signedUrl };
  },

  async applyToJob(userId: string, jobId: string, resumeId: string): Promise<string> {
    // Never fake a submission: if this doesn't persist, the student must know.
    const { data, error } = await supabase
      .from("applications")
      .insert({ user_id: userId, job_id: jobId, resume_id: resumeId })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(
        error?.code === "23505"
          ? "You've already applied to this job."
          : `Could not submit your application: ${error?.message ?? "please try again."}`
      );
    }
    return data.id;
  },

  async getAppliedJobs(userId: string): Promise<JobApplication[]> {
    return orSample<JobApplication>(
      "getAppliedJobs",
      async () => {
        const { data, error } = await supabase
          .from("applications")
          .select("*, job:jobs(*, company:companies(name, logo_url)), resume:resumes(file_name)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row: any) => ({
          id: row.id,
          job: mapJobRow(row.job),
          appliedAt: row.created_at,
          resumeFileName: row.resume?.file_name ?? "Resume.pdf",
          overallStatus: row.status,
          stages: [] as ApplicationStage[],
        }));
      },
      sampleAppliedJobs()
    );
  },

  async getApplicationDetail(applicationId: string): Promise<JobApplication> {
    try {
    const [{ data: appRow, error: appError }, { data: stageRows, error: stageError }] = await Promise.all([
      supabase
        .from("applications")
        .select("*, job:jobs(*, company:companies(name, logo_url)), resume:resumes(file_name)")
        .eq("id", applicationId)
        .single(),
      supabase.from("application_stages").select("*").eq("application_id", applicationId).order("sort_order", { ascending: true }),
    ]);
    if (appError || !appRow) throw new Error("Application not found.");
    if (stageError) throw new Error(stageError.message);

      return {
        id: appRow.id,
        job: mapJobRow(appRow.job),
        appliedAt: appRow.created_at,
        resumeFileName: appRow.resume?.file_name ?? "Resume.pdf",
        overallStatus: appRow.status,
        stages: (stageRows ?? [])
          .map((s: any) => ({ label: s.label, status: s.status, date: s.occurred_at }))
          .sort((a: ApplicationStage, b: ApplicationStage) => stageStatusOrder(a.status) - stageStatusOrder(b.status)),
      };
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getApplicationDetail: using sample content in dev (${(error as Error).message})`);
        return sampleApplicationDetail(applicationId);
      }
      throw error;
    }
  },

  async getJobAlertPreferences(userId: string): Promise<JobAlertPreferences> {
    try {
      const { data, error } = await supabase.from("job_alerts").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      // a new student has not set up a job alert yet — return an empty/disabled
      // config, not the sample "Frontend Developer / Bangalore" one.
      if (!data) return { enabled: false, jobRole: "", location: "", experience: "", salaryRange: "", jobType: "All" };
      return {
        enabled: data.enabled,
        jobRole: data.job_role ?? "",
        location: data.location ?? "",
        experience: data.experience ?? "",
        salaryRange: data.salary_range ?? "",
        jobType: data.job_type ?? "All",
      };
    } catch (error) {
      if (__DEV__) {
        console.info(`[job.service] getJobAlertPreferences: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_JOB_ALERT_PREFS;
      }
      throw error;
    }
  },

  async saveJobAlertPreferences(userId: string, prefs: JobAlertPreferences): Promise<void> {
    const { error } = await supabase.from("job_alerts").upsert({
      user_id: userId,
      enabled: prefs.enabled,
      job_role: prefs.jobRole,
      location: prefs.location,
      experience: prefs.experience,
      salary_range: prefs.salaryRange,
      job_type: prefs.jobType,
    });
    if (error) throw new Error(`Couldn't save your job alert: ${error.message}`);
  },
};
