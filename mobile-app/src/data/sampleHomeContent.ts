import type {
  Project,
  ProjectCategory,
  Job,
  AppNotification,
  OfferBanner,
} from "@/types";

/**
 * Sample content that mirrors the Module 2 (Home) mockups.
 *
 * Every Home service call tries Supabase first and falls back to this data
 * when the project's database has not been seeded yet, so the screens render
 * exactly like the designs out of the box. Once the real tables contain rows,
 * the live data takes over automatically.
 */

const project = (
  id: string,
  title: string,
  categoryName: string,
  techStack: string[],
  price: number,
  rating: number,
  reviewCount: number,
  extra: Partial<Project> = {}
): Project => ({
  id,
  title,
  categoryId: id,
  categoryName,
  techStack,
  price,
  rating,
  reviewCount,
  thumbnailUrl: null,
  isPremium: false,
  isBestSeller: false,
  salesCount: reviewCount * 2,
  createdAt: "2025-05-01T00:00:00.000Z",
  ...extra,
});

const job = (
  id: string,
  title: string,
  companyName: string,
  location: string,
  salaryRange: string,
  postedAt: string,
  isNew = true
): Job => ({
  id,
  title,
  companyId: id,
  companyName,
  companyLogoUrl: null,
  location,
  salaryRange,
  postedAt,
  jobType: "Full Time",
  isNew,
});

export const SAMPLE_CATEGORIES: ProjectCategory[] = [
  { id: "web-development", name: "Web Development", icon: "globe-outline", projectCount: 1200 },
  { id: "mobile-development", name: "Mobile Development", icon: "phone-portrait-outline", projectCount: 850 },
  { id: "data-science", name: "Data Science", icon: "bar-chart-outline", projectCount: 650 },
  { id: "machine-learning", name: "Machine Learning", icon: "hardware-chip-outline", projectCount: 420 },
  { id: "ui-ux-design", name: "UI/UX Design", icon: "color-palette-outline", projectCount: 530 },
  { id: "devops", name: "DevOps", icon: "git-branch-outline", projectCount: 310 },
  { id: "dsa-algorithms", name: "DSA & Algorithms", icon: "git-network-outline", projectCount: 740 },
  { id: "database", name: "Database", icon: "server-outline", projectCount: 380 },
  { id: "cloud-computing", name: "Cloud Computing", icon: "cloud-outline", projectCount: 290 },
  { id: "cyber-security", name: "Cyber Security", icon: "shield-checkmark-outline", projectCount: 260 },
];

export const SAMPLE_TRENDING: Project[] = [
  project("tr-1", "E-Commerce Website", "Web Development", ["React", "Node.js", "MongoDB"], 499, 4.6, 122),
  project("tr-2", "Hospital Management System", "Web Development", ["PHP", "MySQL"], 299, 4.5, 98),
  project("tr-3", "Portfolio Website", "Web Development", ["HTML", "CSS", "JavaScript"], 199, 4.4, 86),
  project("tr-4", "Chat Application", "Web Development", ["Node.js", "Socket.io"], 349, 4.6, 74),
  project("tr-5", "Task Management App", "Mobile Development", ["React", "Firebase"], 249, 4.3, 68),
];

export const SAMPLE_PREMIUM: Project[] = [
  project("pr-1", "Real Estate Platform", "Web Development", ["MERN Stack"], 699, 4.7, 132, { isPremium: true }),
  project("pr-2", "Crypto Trading Platform", "Web Development", ["Next.js", "Web3", "Node.js"], 799, 4.8, 98, { isPremium: true }),
  project("pr-3", "AI Chat Application", "Machine Learning", ["Python", "FastAPI", "React"], 599, 4.6, 76, { isPremium: true }),
  project("pr-4", "SaaS Project Starter", "Web Development", ["Next.js", "Stripe", "Tailwind"], 649, 4.7, 64, { isPremium: true }),
];

export const SAMPLE_BEST_SELLERS: Project[] = [
  project("bs-1", "E-Commerce Website", "Web Development", ["React", "Node.js", "MongoDB"], 499, 4.6, 128, { isBestSeller: true }),
  project("bs-2", "Blog Website", "Web Development", ["WordPress", "PHP", "MySQL"], 299, 4.4, 102, { isBestSeller: true }),
  project("bs-3", "Portfolio Website", "Web Development", ["HTML", "CSS", "JavaScript"], 199, 4.4, 86, { isBestSeller: true }),
  project("bs-4", "School Management System", "Web Development", ["PHP", "MySQL"], 249, 4.5, 78, { isBestSeller: true }),
  project("bs-5", "Food Delivery App", "Mobile Development", ["Flutter", "Firebase"], 349, 4.3, 66, { isBestSeller: true }),
];

export const SAMPLE_NEW_ARRIVALS: Project[] = [
  project("na-1", "NFT Marketplace", "Web Development", ["Next.js", "Solidity"], 599, 4.5, 28),
  project("na-2", "Fitness Website", "Web Development", ["React", "Tailwind CSS"], 199, 4.4, 20),
  project("na-3", "Weather App", "Mobile Development", ["Flutter", "OpenWeather API"], 149, 4.3, 18),
  project("na-4", "Movie Recommendation", "Machine Learning", ["Python", "ML"], 249, 4.5, 16),
  project("na-5", "Notes App", "Mobile Development", ["React", "Firebase"], 149, 4.2, 12),
];

export const SAMPLE_SEARCH_PROJECTS: Project[] = [
  project("se-1", "E-Commerce Website", "Web Development", ["React", "Node.js", "MongoDB"], 499, 4.6, 128),
  project("se-2", "E-Commerce App", "Mobile Development", ["Flutter", "Firebase"], 399, 4.4, 96),
  project("se-3", "E-Commerce Admin Panel", "Web Development", ["React", "Node.js", "MongoDB"], 449, 4.5, 72),
  project("se-4", "E-Commerce API", "Web Development", ["Node.js", "Express", "MongoDB"], 299, 4.3, 54),
  project("se-5", "E-Commerce with Payment Gateway", "Web Development", ["React", "Node.js", "Razorpay"], 549, 4.6, 102),
];

export const SAMPLE_LATEST_JOBS: Job[] = [
  job("jb-1", "Full Stack Developer", "Infosys", "Bangalore", "₹6-10 LPA", "2d ago"),
  job("jb-2", "React Developer", "TCS", "Hyderabad", "₹5-9 LPA", "1d ago"),
  job("jb-3", "UI/UX Designer", "Wipro", "Pune", "₹4-8 LPA", "3d ago"),
  job("jb-4", "Java Developer", "Capgemini", "Chennai", "₹4-7 LPA", "2d ago"),
  job("jb-5", "Data Analyst", "Accenture", "Bangalore", "₹5-8 LPA", "4d ago", false),
];

/** Built at call time so the "Today" / "Yesterday" grouping stays correct. */
export function buildSampleNotifications(): AppNotification[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
  return [
    { id: "nt-1", title: "Special Offer!", body: "Get 40% OFF on all Premium Projects.", category: "offers", isRead: false, createdAt: hoursAgo(2) },
    { id: "nt-2", title: "New Project Added", body: "E-Commerce Flutter App has been added.", category: "updates", isRead: false, createdAt: hoursAgo(5) },
    { id: "nt-3", title: "Price Drop Alert", body: "React Portfolio Project is now at ₹199 only!", category: "offers", isRead: true, createdAt: hoursAgo(7) },
    { id: "nt-4", title: "New Job Match", body: "Full Stack Developer at TCS", category: "updates", isRead: true, createdAt: daysAgo(1) },
    { id: "nt-5", title: "Weekly Report", body: "You solved 12 MCQs this week.", category: "messages", isRead: true, createdAt: daysAgo(1) },
  ];
}

export const SAMPLE_OFFERS: OfferBanner[] = [
  { id: "of-1", title: "Flat 40% OFF", description: "On All Premium Projects", discountLabel: "40%", couponCode: "PREMIUM40" },
  { id: "of-2", title: "Flat 30% OFF", description: "On New Arrivals", discountLabel: "30%", couponCode: "NEW30" },
  { id: "of-3", title: "Flat 20% OFF", description: "On Best Sellers", discountLabel: "20%", couponCode: "BEST20" },
];
