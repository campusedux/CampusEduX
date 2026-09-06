/** Fixture rows for the `companies` / `recruiters` tables. */

export const companyRow = {
  id: "google",
  name: "Google",
  logo_url: null,
  website: "www.google.com",
  rating: 4.4,
  review_count: 12500,
  employee_count: "10k+",
  about: "Google organizes the world's information.",
  open_jobs_count: 123,
};

export const companyRows = [
  companyRow,
  {
    ...companyRow,
    id: "tcs",
    name: "TCS",
    website: "www.tcs.com",
    rating: 4.1,
    review_count: 8700,
    open_jobs_count: 87,
  },
];

export const recruiterRow = {
  id: "rec-1",
  company_id: "infosys",
  name: "Neha Verma",
  title: "Senior Talent Acquisition Specialist",
  rating: 4.6,
  review_count: 320,
  email: "neha.verma@example.com",
  phone: "+91 98765 12345",
  location: "Mumbai, India",
  about: "6+ years hiring tech talent.",
  company: { name: "Infosys", logo_url: null },
};
