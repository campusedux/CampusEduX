import type {
  Job,
  JobDetail,
  Company,
  Recruiter,
  JobApplication,
  ApplicationStage,
  JobAlertPreferences,
} from "@/types";

/**
 * Sample content for Module 4 (Jobs). Each job service call tries Supabase
 * first and falls back to this data so the screens render like the mockups
 * before the database is seeded.
 */

const job = (
  id: string,
  title: string,
  companyId: string,
  companyName: string,
  location: string,
  salaryRange: string,
  postedAt: string,
  isNew = true,
  jobType: Job["jobType"] = "Full Time"
): Job => ({
  id,
  title,
  companyId,
  companyName,
  companyLogoUrl: null,
  location,
  salaryRange,
  postedAt,
  jobType,
  isNew,
});

export const SAMPLE_COMPANIES: Company[] = [
  { id: "google", name: "Google", logoUrl: null, website: "www.google.com", rating: 4.4, reviewCount: 12500, employeeCount: "10k+", about: "Google's mission is to organize the world's information and make it universally accessible and useful.", openJobsCount: 123 },
  { id: "microsoft", name: "Microsoft", logoUrl: null, website: "www.microsoft.com", rating: 4.3, reviewCount: 9800, employeeCount: "10k+", about: "Microsoft empowers every person and organization on the planet to achieve more.", openJobsCount: 98 },
  { id: "tcs", name: "TCS", logoUrl: null, website: "www.tcs.com", rating: 4.1, reviewCount: 8700, employeeCount: "10k+", about: "Tata Consultancy Services is an IT services, consulting and business solutions organization.", openJobsCount: 87 },
  { id: "infosys", name: "Infosys", logoUrl: null, website: "www.infosys.com", rating: 4.0, reviewCount: 7400, employeeCount: "10k+", about: "Infosys is a global leader in next-generation digital services and consulting.", openJobsCount: 74 },
  { id: "wipro", name: "Wipro", logoUrl: null, website: "www.wipro.com", rating: 3.9, reviewCount: 6500, employeeCount: "10k+", about: "Wipro is a leading technology services and consulting company.", openJobsCount: 65 },
  { id: "amazon", name: "Amazon", logoUrl: null, website: "www.amazon.jobs", rating: 4.2, reviewCount: 11200, employeeCount: "10k+", about: "Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.", openJobsCount: 60 },
  { id: "deloitte", name: "Deloitte", logoUrl: null, website: "www.deloitte.com", rating: 4.0, reviewCount: 5100, employeeCount: "10k+", about: "Deloitte provides audit, consulting, tax and advisory services.", openJobsCount: 51 },
  { id: "accenture", name: "Accenture", logoUrl: null, website: "www.accenture.com", rating: 4.1, reviewCount: 8900, employeeCount: "10k+", about: "Accenture is a global professional services company with leading capabilities in digital, cloud and security.", openJobsCount: 45 },
  { id: "capgemini", name: "Capgemini", logoUrl: null, website: "www.capgemini.com", rating: 3.9, reviewCount: 4300, employeeCount: "10k+", about: "Capgemini is a global leader in partnering with companies to transform and manage their business.", openJobsCount: 32 },
];

export const SAMPLE_JOBS: Job[] = [
  job("job-1", "Full Stack Developer", "infosys", "Infosys", "Bangalore, India", "₹6-10 LPA", "2d ago"),
  job("job-2", "React Developer", "tcs", "TCS", "Hyderabad, India", "₹5-9 LPA", "1d ago"),
  job("job-3", "UI/UX Designer", "wipro", "Wipro", "Pune, India", "₹4-8 LPA", "3d ago"),
  job("job-4", "Java Developer", "capgemini", "Capgemini", "Chennai, India", "₹4-7 LPA", "2d ago"),
  job("job-5", "Data Analyst", "accenture", "Accenture", "Bangalore, India", "₹5-8 LPA", "4d ago", false),
  job("job-6", "Frontend Developer", "tcs", "TCS", "Mumbai, India", "₹5-9 LPA", "2d ago"),
  job("job-7", "Backend Developer", "amazon", "Amazon", "Bangalore, India", "₹10-18 LPA", "5d ago", false),
  job("job-8", "Product Manager", "google", "Google", "Bangalore, India", "₹20-35 LPA", "1d ago"),
  job("job-9", "Software Engineer", "microsoft", "Microsoft", "Hyderabad, India", "₹15-25 LPA", "3d ago"),
  job("job-10", "Data Scientist", "microsoft", "Microsoft", "Hyderabad, India", "₹12-20 LPA", "5d ago", false),
];

export function sampleJobDetail(jobId: string): JobDetail {
  const base = SAMPLE_JOBS.find((j) => j.id === jobId) ?? SAMPLE_JOBS[5];
  const company = SAMPLE_COMPANIES.find((c) => c.id === base.companyId) ?? SAMPLE_COMPANIES[2];
  return {
    ...base,
    id: jobId,
    description:
      "We are looking for a skilled developer to build responsive and user-friendly web applications. You will work with a cross-functional team to design, build and ship new features end to end.",
    requirements: [
      "2-4 years of experience",
      "Strong in HTML, CSS, JavaScript",
      "Experience with React.js",
      "Good problem solving skills",
    ],
    skills: ["HTML", "CSS", "JavaScript", "React", "Git"],
    experience: "2-4 Yrs Exp",
    companyRating: company.rating,
    companyReviewCount: company.reviewCount,
    isSaved: false,
    hasApplied: false,
  };
}

export function sampleRecruiter(jobId: string): Recruiter {
  const detail = sampleJobDetail(jobId);
  return {
    id: "rec-1",
    name: "Neha Verma",
    title: "Senior Talent Acquisition Specialist",
    companyName: detail.companyName,
    companyLogoUrl: null,
    rating: 4.6,
    reviewCount: 320,
    email: "neha.verma@example.com",
    phone: "+91 98765 12345",
    location: "Mumbai, India",
    about:
      "Neha has 6+ years of experience in hiring top tech talent across India. She specializes in full-cycle recruitment for IT roles.",
  };
}

export function sampleSavedJobs(): Job[] {
  return SAMPLE_JOBS.filter((j) => ["job-3", "job-8", "job-9", "job-7", "job-5"].includes(j.id));
}

const stages = (offsets: { label: string; status: ApplicationStage["status"]; daysAgo: number | null }[]): ApplicationStage[] =>
  offsets.map((s) => ({
    label: s.label,
    status: s.status,
    date: s.daysAgo === null ? null : new Date(Date.now() - s.daysAgo * 86_400_000).toISOString(),
  }));

export function sampleAppliedJobs(): JobApplication[] {
  const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  return [
    {
      id: "app-1",
      job: SAMPLE_JOBS[5],
      appliedAt: daysAgo(7),
      resumeFileName: "My Resume.pdf",
      overallStatus: "in_review",
      stages: stages([
        { label: "Application Submitted", status: "completed", daysAgo: 7 },
        { label: "HR Review", status: "completed", daysAgo: 5 },
        { label: "Technical Round", status: "in_progress", daysAgo: null },
        { label: "HR Interview", status: "pending", daysAgo: null },
        { label: "Final Decision", status: "pending", daysAgo: null },
      ]),
    },
    {
      id: "app-2",
      job: SAMPLE_JOBS[4],
      appliedAt: daysAgo(12),
      resumeFileName: "My Resume.pdf",
      overallStatus: "shortlisted",
      stages: stages([
        { label: "Application Submitted", status: "completed", daysAgo: 12 },
        { label: "HR Review", status: "completed", daysAgo: 10 },
        { label: "Technical Round", status: "completed", daysAgo: 6 },
        { label: "HR Interview", status: "in_progress", daysAgo: null },
        { label: "Final Decision", status: "pending", daysAgo: null },
      ]),
    },
    {
      id: "app-3",
      job: SAMPLE_JOBS[2],
      appliedAt: daysAgo(20),
      resumeFileName: "My Resume.pdf",
      overallStatus: "rejected",
      stages: stages([
        { label: "Application Submitted", status: "completed", daysAgo: 20 },
        { label: "HR Review", status: "completed", daysAgo: 18 },
        { label: "Technical Round", status: "completed", daysAgo: 14 },
        { label: "Final Decision", status: "completed", daysAgo: 10 },
      ]),
    },
  ];
}

export function sampleApplicationDetail(applicationId: string): JobApplication {
  return sampleAppliedJobs().find((a) => a.id === applicationId) ?? sampleAppliedJobs()[0];
}

export function sampleResumes() {
  return [
    { id: "resume-1", fileName: "My Resume.pdf", fileUrl: "", uploadedAt: new Date(Date.now() - 8 * 86_400_000).toISOString() },
  ];
}

export const SAMPLE_JOB_ALERT_PREFS: JobAlertPreferences = {
  enabled: true,
  jobRole: "Frontend Developer",
  location: "Bangalore, India",
  experience: "1 - 5 Years",
  salaryRange: "₹5 LPA - ₹15 LPA",
  jobType: "Full Time",
};
