import { buildResumeRenderModel, type ResumeRenderModel } from "./renderModel";
import type { ResumeContent, ResumeSectionBlock, SectionType } from "./content";
import { EMPTY_PERSONAL, type ResumePersonalDetails } from "./types";
import type { TemplateId } from "./templateSpecs";

/**
 * A complete, realistic demo résumé for each template — one distinct persona
 * per template so the gallery thumbnails, the preview modal AND a freshly
 * created résumé all show a full professional document rather than a blank
 * form. Plain data: shown behind a "Demo content" banner in the editor and
 * cleared / replaced on the student's command (never silently mixed with
 * their real information). No lorem ipsum, no "John Doe".
 */

let seq = 0;
const uid = (p: string) => `${p}-demo-${(seq += 1).toString(36)}`;

function text(type: SectionType, heading: string, body: string): ResumeSectionBlock {
  return { id: uid("blk"), type, heading, variant: "text", hidden: false, text: body };
}
function entries(
  type: SectionType,
  heading: string,
  rows: Array<Partial<Omit<import("./content").ResumeEntry, "id">>>,
): ResumeSectionBlock {
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
function tags(type: SectionType, heading: string, groups: Array<{ label: string; items: string[] }>): ResumeSectionBlock {
  return {
    id: uid("blk"),
    type,
    heading,
    variant: "tags",
    hidden: false,
    groups: groups.map((g) => ({ id: uid("grp"), label: g.label, items: g.items })),
  };
}
function links(type: SectionType, heading: string, rows: Array<{ label: string; url: string }>): ResumeSectionBlock {
  return {
    id: uid("blk"),
    type,
    heading,
    variant: "links",
    hidden: false,
    links: rows.map((r) => ({ id: uid("lnk"), label: r.label, url: r.url })),
  };
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
    ...EMPTY_PERSONAL,
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
    text(
      "summary",
      "Professional Summary",
      "Software engineer with 3 years building and scaling full-stack web products in TypeScript, React and Node. Shipped features used by 300k+ monthly users, with a track record of measurable performance and reliability wins. Comfortable owning a service end to end — from design doc through on-call.",
    ),
    entries("experience", "Work Experience", [
      {
        title: "Software Engineer",
        subtitle: "TechNova Solutions",
        location: "Bengaluru",
        startDate: "Jul 2023",
        endDate: "Present",
        description:
          "Built a React + TypeScript component library adopted by 6 product teams, cutting new-screen build time ~40%\nReduced checkout API p95 latency 38% with read-through caching and query batching\nLed the migration of the billing service to typed event contracts, removing a recurring class of production incidents",
        tags: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
      },
      {
        title: "Associate Software Engineer",
        subtitle: "Finlyte",
        location: "Remote",
        startDate: "Jun 2021",
        endDate: "Jun 2023",
        description:
          "Delivered the customer self-serve refunds flow end to end (React, Node, Postgres), deflecting ~1,200 support tickets/month\nRaised payments-module test coverage from 54% to 88% and set up CI gates",
        tags: ["React", "Express", "Jest"],
      },
    ]),
    entries("internships", "Internships", [
      {
        title: "Software Engineering Intern",
        subtitle: "Zeta",
        location: "Bengaluru",
        startDate: "Jan 2021",
        endDate: "May 2021",
        description: "Prototyped an internal feature-flag dashboard now used across 4 teams",
      },
    ]),
    entries("projects", "Projects", [
      {
        title: "DevMetrics",
        subtitle: "Go, ClickHouse, Grafana",
        description: "Self-hosted engineering-metrics dashboard; ingests 2M events/day and renders DORA metrics per team",
        url: "github.com/aaravsharma/devmetrics",
      },
      {
        title: "Snippet Sync",
        subtitle: "React Native, Supabase",
        description: "Cross-device code-snippet manager with offline-first sync; 800+ installs",
      },
    ]),
    entries("education", "Education", [
      {
        title: "B.E. Computer Science & Engineering",
        subtitle: "R.V. College of Engineering, Bengaluru",
        startDate: "2017",
        endDate: "2021",
        description: "CGPA 8.7 / 10 · Coursework: Distributed Systems, Databases, Operating Systems",
      },
    ]),
    tags("skills", "Technical Skills", [
      { label: "Languages", items: ["TypeScript", "JavaScript", "Go", "Python", "SQL"] },
      { label: "Frameworks", items: ["React", "Next.js", "Node.js", "Express"] },
      { label: "Infra", items: ["PostgreSQL", "Redis", "Docker", "AWS", "CI/CD"] },
    ]),
    tags("interests", "Soft Skills", [{ label: "", items: ["Ownership", "Mentoring", "Clear written communication", "Bias to ship"] }]),
    text("certifications", "Certifications", "AWS Certified Developer – Associate (2024)\nMongoDB Associate Developer (2022)"),
    text("achievements", "Achievements", "Winner — Smart India Hackathon 2020 (from 1,200+ teams)\nSpeaker, ReactBLR meetup: “Cutting p95 with cache-aside” (2024)"),
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
    ...EMPTY_PERSONAL,
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
    text(
      "summary",
      "Professional Summary",
      "Backend-leaning software engineer with 5 years in regulated FinTech environments. Owns high-availability payment services, mentors two junior engineers, and partners closely with risk and compliance. Strong on system design, observability and incident response.",
    ),
    entries("experience", "Work Experience", [
      {
        title: "Software Engineer II",
        subtitle: "Axis Digital Banking",
        location: "Pune",
        startDate: "Apr 2022",
        endDate: "Present",
        description:
          "Own the real-time payments authorisation service (99.98% availability, 4k TPS peak)\nCut settlement reconciliation time from 6 hours to 25 minutes by redesigning the batch pipeline\nIntroduced structured audit logging adopted org-wide for RBI compliance reporting\nMentor 2 junior engineers; run the team's weekly design review",
        tags: ["Java", "Spring Boot", "Kafka", "Oracle", "Kubernetes"],
      },
      {
        title: "Software Engineer",
        subtitle: "Infosys — Banking Practice",
        location: "Pune",
        startDate: "Jul 2019",
        endDate: "Mar 2022",
        description:
          "Built core-banking integration adapters for 3 client migrations, each delivered on schedule\nReduced a client's month-end reporting job from 90 to 32 minutes",
        tags: ["Java", "PL/SQL", "REST"],
      },
    ]),
    entries("education", "Education", [
      {
        title: "B.Tech Information Technology",
        subtitle: "College of Engineering, Pune (COEP)",
        startDate: "2015",
        endDate: "2019",
        description: "First Class with Distinction · GPA 8.4 / 10",
      },
    ]),
    tags("skills", "Technical Skills", [
      { label: "Languages", items: ["Java", "Kotlin", "SQL", "Bash"] },
      { label: "Platform", items: ["Spring Boot", "Kafka", "Oracle", "PostgreSQL", "Kubernetes", "Grafana"] },
      { label: "Practices", items: ["System design", "Observability", "Incident response", "Threat modelling"] },
    ]),
    text(
      "certifications",
      "Certifications",
      "Oracle Certified Professional, Java SE 11 Developer (2021)\nCertified Kubernetes Application Developer — CKAD (2023)\nAWS Certified Solutions Architect – Associate (2022)",
    ),
    text(
      "achievements",
      "Achievements",
      "Axis Bank “Spot Award” for the settlement pipeline redesign (2023)\nFiled 1 internal patent for a fraud-signal batching technique (pending)",
    ),
    entries("volunteer", "Volunteer Experience", [
      {
        title: "Coding Mentor",
        subtitle: "Pune Rural STEM Program",
        startDate: "2021",
        endDate: "Present",
        description: "Weekend Java/DSA sessions for first-generation engineering students",
      },
    ]),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Malayalam (Native)", "Hindi (Fluent)", "Marathi (Conversational)"] }]),
    text("references", "References", "Available on request."),
  ],
};

const MINIMAL: DemoResume = {
  label: "Data Analyst",
  persona: "Data Analyst",
  personalDetails: {
    ...EMPTY_PERSONAL,
    fullName: "Devansh Rao",
    jobTitle: "Data Analyst",
    email: "devansh.rao@email.com",
    phone: "+91 90080 77314",
    location: "Hyderabad, India",
    linkedin: "linkedin.com/in/devanshrao",
    website: "devanshrao.com",
  },
  content: [
    text(
      "summary",
      "Summary",
      "Data analyst with 2 years turning messy operational data into decisions. Fluent in SQL and Python, builds self-serve dashboards, and communicates findings crisply to non-technical stakeholders.",
    ),
    entries("experience", "Experience", [
      {
        title: "Data Analyst",
        subtitle: "BlueCart Logistics",
        location: "Hyderabad",
        startDate: "Aug 2023",
        endDate: "Present",
        description:
          "Built the delivery-SLA dashboard used daily by 40+ ops leads; cut ad-hoc report requests 60%\nIdentified a routing inefficiency worth ₹1.4 Cr/year in fuel savings; change adopted in 3 zones\nAutomated the weekly leadership deck (Python + Sheets API), saving ~6 analyst-hours/week",
        tags: ["SQL", "Python", "Looker", "dbt"],
      },
      {
        title: "Analytics Associate",
        subtitle: "GrowEasy",
        location: "Remote",
        startDate: "Jun 2022",
        endDate: "Jul 2023",
        description: "Ran A/B tests for the onboarding funnel; two winning variants lifted activation 11%",
        tags: ["SQL", "Excel", "Amplitude"],
      },
    ]),
    entries("projects", "Projects", [
      {
        title: "IPL Win-Probability Model",
        subtitle: "Python, scikit-learn, Streamlit",
        description: "Live win-probability estimator; Brier score 0.19 on the 2023 season hold-out",
      },
      {
        title: "City AQI Explorer",
        subtitle: "SQL, Metabase",
        description: "Cleaned 4 years of CPCB station data and published an open, filterable dashboard",
      },
    ]),
    entries("education", "Education", [
      {
        title: "B.Sc. Statistics (Hons.)",
        subtitle: "University of Hyderabad",
        startDate: "2019",
        endDate: "2022",
        description: "Distinction · Electives: Regression Analysis, Time Series, Design of Experiments",
      },
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
    ...EMPTY_PERSONAL,
    fullName: "Ananya Iyer",
    jobTitle: "Product Designer",
    email: "ananya.iyer@email.com",
    phone: "+91 98670 30219",
    location: "Mumbai, India",
    linkedin: "linkedin.com/in/ananyaiyer",
    website: "ananya.design",
  },
  content: [
    text(
      "summary",
      "Profile",
      "Product designer with 4 years shipping consumer mobile apps end to end — research, interaction, visual and design-system work. I prototype fast, measure what I ship, and love turning a fuzzy problem into a clear, testable flow.",
    ),
    entries("experience", "Experience", [
      {
        title: "Product Designer",
        subtitle: "Hopscotch (kids' learning app)",
        location: "Mumbai",
        startDate: "Feb 2023",
        endDate: "Present",
        description:
          "Redesigned onboarding: completion up from 61% to 82% over two iterations\nOwn the mobile design system (120+ components) used by 5 designers and 14 engineers\nRan 30+ moderated usability sessions; findings reshaped the core lesson-player",
        tags: ["Figma", "Prototyping", "Design systems", "Usability testing"],
      },
      {
        title: "UI/UX Designer",
        subtitle: "Foxtrot Studio",
        location: "Bengaluru",
        startDate: "Jul 2020",
        endDate: "Jan 2023",
        description:
          "Designed 4 client apps from zero to launch (fintech, travel, D2C)\nBuilt the studio's reusable Figma UI kit, cutting new-project setup from days to hours",
        tags: ["Figma", "Illustration", "Motion"],
      },
    ]),
    entries("projects", "Selected Work", [
      {
        title: "Split — group expenses, redesigned",
        subtitle: "Concept · case study",
        description: "End-to-end concept: research, flows, hi-fi UI, prototype. Featured on Bestfolios.",
        url: "ananya.design/split",
      },
      {
        title: "Transit — accessible metro app",
        subtitle: "WCAG AA, large-type mode",
        description: "Rebuilt fare + route flows around accessibility; validated with 6 low-vision users",
      },
    ]),
    entries("education", "Education", [
      {
        title: "B.Des Communication Design",
        subtitle: "MIT Institute of Design, Pune",
        startDate: "2016",
        endDate: "2020",
        description: "Graduated with Distinction · Thesis: play patterns in early-learning apps",
      },
    ]),
    tags("skills", "Skills", [
      { label: "Design", items: ["Figma", "Prototyping", "Design systems", "Interaction design", "Visual design"] },
      { label: "Research", items: ["Usability testing", "Surveys", "Journey mapping", "A/B testing"] },
      { label: "Bonus", items: ["HTML/CSS", "After Effects", "Illustration"] },
    ]),
    text("certifications", "Certifications", "NN/g UX Certification (2022)\nInteraction Design Foundation — Design Systems (2021)"),
    text("achievements", "Recognition", "CSSDA Special Kudos for the Split case study (2023)\nSpeaker, UX India 2022: “Designing for six-year-olds”"),
    links("social_links", "Links", [
      { label: "Portfolio", url: "ananya.design" },
      { label: "Dribbble", url: "dribbble.com/ananyaiyer" },
      { label: "Behance", url: "behance.net/ananyaiyer" },
    ]),
    tags("languages", "Languages", [{ label: "", items: ["English (Fluent)", "Tamil (Native)", "Hindi (Fluent)"] }]),
  ],
};

export const DEMO_RESUMES: Record<TemplateId, DemoResume> = {
  modern: MODERN,
  professional: PROFESSIONAL,
  minimal: MINIMAL,
  creative: CREATIVE,
};

export function demoResume(templateId: string): DemoResume {
  return DEMO_RESUMES[(templateId ?? "") as TemplateId] ?? MODERN;
}

const modelCache = new Map<string, ResumeRenderModel>();
/** Memoised render model for a template's demo persona — used by the gallery thumbnail + preview modal. */
export function demoRenderModel(templateId: string): ResumeRenderModel {
  const key = (DEMO_RESUMES[(templateId ?? "") as TemplateId] ? templateId : "modern") as string;
  let model = modelCache.get(key);
  if (!model) {
    const d = demoResume(key);
    model = buildResumeRenderModel({ personalDetails: d.personalDetails, content: d.content });
    modelCache.set(key, model);
  }
  return model;
}
