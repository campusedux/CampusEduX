/** Fixture rows for the `jobs` / `applications` / `saved_jobs` tables. */

export const jobRow = {
  id: "job-1",
  title: "Full Stack Developer",
  company_id: "infosys",
  company: { name: "Infosys", logo_url: null, rating: 4.0, review_count: 7400 },
  location: "Bangalore, India",
  salary_range: "₹6-10 LPA",
  salary_min_lpa: 6,
  salary_max_lpa: 10,
  job_type: "Full Time",
  posted_at: "2025-05-01T00:00:00.000Z",
  created_at: "2025-05-01T00:00:00.000Z",
  description: "We are looking for a skilled developer.",
  requirements: ["2-4 years of experience"],
  skills: ["HTML", "CSS", "JavaScript", "React", "Git"],
  experience: "2-4 Yrs Exp",
};

export const jobRows = [
  jobRow,
  {
    ...jobRow,
    id: "job-2",
    title: "React Developer",
    company_id: "tcs",
    company: { name: "TCS", logo_url: null, rating: 4.1, review_count: 8700 },
    location: "Hyderabad, India",
    salary_range: "₹5-9 LPA",
    job_type: "Full Time",
  },
];

export const savedJobRows = [{ job: jobRow }];

export const applicationRow = {
  id: "cc000000-0000-0000-0000-000000000001",
  user_id: "u-1",
  job_id: "job-1",
  resume_id: "bb000000-0000-0000-0000-000000000001",
  status: "in_review",
  created_at: "2025-05-10T00:00:00.000Z",
  job: jobRow,
  resume: { file_name: "My Resume.pdf" },
};
