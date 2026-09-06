import type { ResumeContent, ResumeSectionBlock, ResumeSectionEntry, ResumeSectionType, ResumePersonalDetails } from "@/types";

/**
 * One complete demo persona per template — mirrors the website's
 * src/lib/resumeBuilder/demoResumes.ts. Used for the template gallery
 * thumbnails/preview and seeded into a freshly created résumé (flagged
 * is_demo) so the editor never opens on a blank form.
 */

let seq = 0;
const uid = (p: string) => `${p}-demo-${(seq += 1).toString(36)}`;

const EMPTY_PD: ResumePersonalDetails = {
  fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", photoUrl: null,
};

function text(type: ResumeSectionType, heading: string, body: string): ResumeSectionBlock {
  return { id: uid("blk"), type, heading, variant: "text", hidden: false, text: body };
}
function entries(type: ResumeSectionType, heading: string, rows: Partial<Omit<ResumeSectionEntry, "id">>[]): ResumeSectionBlock {
  return {
    id: uid("blk"),
    type,
    heading,
    variant: "entries",
    hidden: false,
    entries: rows.map((r) => ({
      id: uid("ent"),
      title: r.title ?? "",
      subtitle: r.subtitle ?? "",
      location: r.location ?? "",
      startDate: r.startDate ?? "",
      endDate: r.endDate ?? "",
      description: r.description ?? "",
      url: r.url ?? "",
      tags: r.tags ?? [],
    })),
  };
}
function tags(type: ResumeSectionType, heading: string, groups: { label: string; items: string[] }[]): ResumeSectionBlock {
  return { id: uid("blk"), type, heading, variant: "tags", hidden: false, groups: groups.map((g) => ({ id: uid("grp"), label: g.label, items: g.items })) };
}
function links(type: ResumeSectionType, heading: string, rows: { label: string; url: string }[]): ResumeSectionBlock {
  return { id: uid("blk"), type, heading, variant: "links", hidden: false, links: rows.map((r) => ({ id: uid("lnk"), label: r.label, url: r.url })) };
}

export interface DemoResume {
  label: string;
  persona: string;
  personalDetails: ResumePersonalDetails;
  content: ResumeContent;
}

const MODERN: DemoResume = {
  label: "Software Engineer",
  persona: "Software Engineer",
  personalDetails: {
    ...EMPTY_PD,
    fullName: "Aarav Sharma",
    jobTitle: "Software Engineer",
    email: "aarav.sharma@email.com",
    phone: "+91 98200 41562",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/aaravsharma",
    github: "github.com/aaravsharma",
    website: "aarav.dev",
  },
  content: [
    text("summary", "Professional Summary", "Software engineer with 3 years building and scaling full-stack web products in TypeScript, React and Node. Shipped features used by 300k+ monthly users, with a track record of measurable performance and reliability wins."),
    entries("experience", "Work Experience", [
      { title: "Software Engineer", subtitle: "TechNova Solutions", location: "Bengaluru", startDate: "Jul 2023", endDate: "Present", description: "Built a React + TypeScript component library adopted by 6 teams, cutting build time ~40%\nReduced checkout API p95 latency 38% with caching + query batching\nLed the billing service migration to typed event contracts", tags: ["TypeScript", "React", "Node.js", "PostgreSQL"] },
      { title: "Associate Software Engineer", subtitle: "Finlyte", location: "Remote", startDate: "Jun 2021", endDate: "Jun 2023", description: "Delivered the self-serve refunds flow end to end, deflecting ~1,200 tickets/month\nRaised payments-module test coverage from 54% to 88%", tags: ["React", "Express", "Jest"] },
    ]),
    entries("internships", "Internships", [
      { title: "Software Engineering Intern", subtitle: "Zeta", location: "Bengaluru", startDate: "Jan 2021", endDate: "May 2021", description: "Prototyped an internal feature-flag dashboard now used across 4 teams" },
    ]),
    entries("projects", "Projects", [
      { title: "DevMetrics", subtitle: "Go, ClickHouse, Grafana", description: "Self-hosted engineering-metrics dashboard; ingests 2M events/day", url: "github.com/aaravsharma/devmetrics" },
      { title: "Snippet Sync", subtitle: "React Native, Supabase", description: "Cross-device code-snippet manager with offline-first sync; 800+ installs" },
    ]),
    entries("education", "Education", [
      { title: "B.E. Computer Science & Engineering", subtitle: "R.V. College of Engineering, Bengaluru", startDate: "2017", endDate: "2021", description: "CGPA 8.7 / 10" },
    ]),
    tags("skills", "Technical Skills", [
      { label: "Languages", items: ["TypeScript", "JavaScript", "Go", "Python", "SQL"] },
      { label: "Frameworks", items: ["React", "Next.js", "Node.js", "Express"] },
      { label: "Infra", items: ["PostgreSQL", "Redis", "Docker", "AWS", "CI/CD"] },
    ]),
    text("certifications", "Certifications", "AWS Certified Developer – Associate (2024)\nMongoDB Associate Developer (2022)"),
    text("achievements", "Achievements", "Winner — Smart India Hackathon 2020 (from 1,200+ teams)"),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Hindi (Native)", "Kannada (Conversational)"] }]),
    links("coding_profiles", "Coding Profiles", [
      { label: "LeetCode", url: "leetcode.com/u/aaravsharma" },
      { label: "GitHub", url: "github.com/aaravsharma" },
    ]),
  ],
};

const PROFESSIONAL: DemoResume = {
  label: "Software Engineer · Enterprise",
  persona: "Software Engineer (Enterprise / FinTech)",
  personalDetails: {
    ...EMPTY_PD,
    fullName: "Priya Nair",
    jobTitle: "Software Engineer",
    email: "priya.nair@email.com",
    phone: "+91 99401 22087",
    location: "Pune, India",
    linkedin: "linkedin.com/in/priyanair",
    github: "github.com/priyanair",
    website: "priyanair.io",
  },
  content: [
    text("summary", "Professional Summary", "Backend-leaning software engineer with 5 years in regulated FinTech. Owns high-availability payment services, mentors two junior engineers, and partners closely with risk and compliance."),
    entries("experience", "Work Experience", [
      { title: "Software Engineer II", subtitle: "Axis Digital Banking", location: "Pune", startDate: "Apr 2022", endDate: "Present", description: "Own the real-time payments authorisation service (99.98% availability, 4k TPS peak)\nCut settlement reconciliation from 6 hours to 25 minutes\nIntroduced org-wide structured audit logging for RBI compliance", tags: ["Java", "Spring Boot", "Kafka", "Oracle", "Kubernetes"] },
      { title: "Software Engineer", subtitle: "Infosys — Banking Practice", location: "Pune", startDate: "Jul 2019", endDate: "Mar 2022", description: "Built core-banking integration adapters for 3 client migrations, each on schedule\nReduced a client's month-end reporting job from 90 to 32 minutes", tags: ["Java", "PL/SQL", "REST"] },
    ]),
    entries("education", "Education", [
      { title: "B.Tech Information Technology", subtitle: "College of Engineering, Pune (COEP)", startDate: "2015", endDate: "2019", description: "First Class with Distinction · GPA 8.4 / 10" },
    ]),
    tags("skills", "Technical Skills", [
      { label: "Languages", items: ["Java", "Kotlin", "SQL", "Bash"] },
      { label: "Platform", items: ["Spring Boot", "Kafka", "Oracle", "Kubernetes", "Grafana"] },
      { label: "Practices", items: ["System design", "Observability", "Incident response"] },
    ]),
    text("certifications", "Certifications", "Oracle Certified Professional, Java SE 11 (2021)\nCKAD — Certified Kubernetes Application Developer (2023)\nAWS Solutions Architect – Associate (2022)"),
    text("achievements", "Achievements", "Axis Bank “Spot Award” for the settlement pipeline redesign (2023)"),
    entries("volunteer", "Volunteer Experience", [
      { title: "Coding Mentor", subtitle: "Pune Rural STEM Program", startDate: "2021", endDate: "Present", description: "Weekend Java/DSA sessions for first-generation engineering students" },
    ]),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Malayalam (Native)", "Hindi (Fluent)", "Marathi (Conversational)"] }]),
    text("references", "References", "Available on request."),
  ],
};

const MINIMAL: DemoResume = {
  label: "Data Analyst",
  persona: "Data Analyst",
  personalDetails: {
    ...EMPTY_PD,
    fullName: "Devansh Rao",
    jobTitle: "Data Analyst",
    email: "devansh.rao@email.com",
    phone: "+91 90080 77314",
    location: "Hyderabad, India",
    linkedin: "linkedin.com/in/devanshrao",
    website: "devanshrao.com",
  },
  content: [
    text("summary", "Summary", "Data analyst with 2 years turning messy operational data into decisions. Fluent in SQL and Python, builds self-serve dashboards, and communicates findings crisply to non-technical stakeholders."),
    entries("experience", "Experience", [
      { title: "Data Analyst", subtitle: "BlueCart Logistics", location: "Hyderabad", startDate: "Aug 2023", endDate: "Present", description: "Built the delivery-SLA dashboard used daily by 40+ ops leads; cut ad-hoc reports 60%\nFound a routing inefficiency worth ₹1.4 Cr/year in fuel savings\nAutomated the weekly leadership deck, saving ~6 analyst-hours/week", tags: ["SQL", "Python", "Looker", "dbt"] },
      { title: "Analytics Associate", subtitle: "GrowEasy", location: "Remote", startDate: "Jun 2022", endDate: "Jul 2023", description: "Ran A/B tests for the onboarding funnel; two winning variants lifted activation 11%", tags: ["SQL", "Excel", "Amplitude"] },
    ]),
    entries("projects", "Projects", [
      { title: "IPL Win-Probability Model", subtitle: "Python, scikit-learn, Streamlit", description: "Live win-probability estimator; Brier score 0.19 on the 2023 season hold-out" },
      { title: "City AQI Explorer", subtitle: "SQL, Metabase", description: "Cleaned 4 years of CPCB station data and published an open, filterable dashboard" },
    ]),
    entries("education", "Education", [
      { title: "B.Sc. Statistics (Hons.)", subtitle: "University of Hyderabad", startDate: "2019", endDate: "2022", description: "Distinction · Electives: Regression, Time Series, DoE" },
    ]),
    tags("skills", "Skills", [
      { label: "Data", items: ["SQL", "Python (pandas, NumPy)", "dbt", "Excel"] },
      { label: "Viz", items: ["Looker", "Metabase", "Tableau", "matplotlib"] },
      { label: "Stats", items: ["A/B testing", "Regression", "Forecasting"] },
    ]),
    text("certifications", "Certifications", "Google Data Analytics Professional Certificate (2022)\ndbt Fundamentals (2023)"),
    text("achievements", "Achievements", "1st place — Inter-University Datathon 2021\nKaggle Notebooks Expert"),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Telugu (Native)", "Hindi (Fluent)"] }]),
  ],
};

const CREATIVE: DemoResume = {
  label: "Product Designer",
  persona: "Product / UI-UX Designer",
  personalDetails: {
    ...EMPTY_PD,
    fullName: "Ananya Iyer",
    jobTitle: "Product Designer",
    email: "ananya.iyer@email.com",
    phone: "+91 98670 30219",
    location: "Mumbai, India",
    linkedin: "linkedin.com/in/ananyaiyer",
    website: "ananya.design",
  },
  content: [
    text("summary", "Profile", "Product designer with 4 years shipping consumer mobile apps end to end — research, interaction, visual and design-system work. I prototype fast and measure what I ship."),
    entries("experience", "Experience", [
      { title: "Product Designer", subtitle: "Hopscotch (kids' learning app)", location: "Mumbai", startDate: "Feb 2023", endDate: "Present", description: "Redesigned onboarding: completion up from 61% to 82%\nOwn the mobile design system (120+ components) used by 5 designers and 14 engineers\nRan 30+ moderated usability sessions", tags: ["Figma", "Prototyping", "Design systems", "Usability testing"] },
      { title: "UI/UX Designer", subtitle: "Foxtrot Studio", location: "Bengaluru", startDate: "Jul 2020", endDate: "Jan 2023", description: "Designed 4 client apps from zero to launch\nBuilt the studio's reusable Figma UI kit", tags: ["Figma", "Illustration", "Motion"] },
    ]),
    entries("projects", "Selected Work", [
      { title: "Split — group expenses, redesigned", subtitle: "Concept · case study", description: "End-to-end concept: research, flows, hi-fi UI, prototype. Featured on Bestfolios.", url: "ananya.design/split" },
      { title: "Transit — accessible metro app", subtitle: "WCAG AA, large-type mode", description: "Rebuilt fare + route flows around accessibility; validated with 6 low-vision users" },
    ]),
    entries("education", "Education", [
      { title: "B.Des Communication Design", subtitle: "MIT Institute of Design, Pune", startDate: "2016", endDate: "2020", description: "Graduated with Distinction" },
    ]),
    tags("skills", "Skills", [
      { label: "Design", items: ["Figma", "Prototyping", "Design systems", "Interaction design"] },
      { label: "Research", items: ["Usability testing", "Surveys", "Journey mapping"] },
      { label: "Bonus", items: ["HTML/CSS", "After Effects", "Illustration"] },
    ]),
    text("certifications", "Certifications", "NN/g UX Certification (2022)\nIxDF — Design Systems (2021)"),
    text("achievements", "Recognition", "CSSDA Special Kudos for the Split case study (2023)"),
    links("social_links", "Links", [
      { label: "Portfolio", url: "ananya.design" },
      { label: "Dribbble", url: "dribbble.com/ananyaiyer" },
      { label: "Behance", url: "behance.net/ananyaiyer" },
    ]),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Tamil (Native)", "Hindi (Fluent)"] }]),
  ],
};

export const DEMO_RESUMES: Record<string, DemoResume> = {
  modern: MODERN,
  professional: PROFESSIONAL,
  minimal: MINIMAL,
  creative: CREATIVE,
};

export function demoResume(templateId: string): DemoResume {
  return DEMO_RESUMES[templateId] ?? MODERN;
}
