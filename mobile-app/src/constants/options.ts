export const COURSES = [
  { id: "bams", label: "BAMS", icon: "medkit-outline" },
  { id: "btech", label: "B.Tech", icon: "desktop-outline" },
  { id: "bca", label: "BCA", icon: "laptop-outline" },
  { id: "mca", label: "MCA", icon: "school-outline" },
  { id: "mba", label: "MBA", icon: "briefcase-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal" },
] as const;

export const BRANCHES = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other",
] as const;

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year"] as const;
