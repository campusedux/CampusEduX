import { buildResumeRenderModel, type ResumeRenderModel } from "./renderModel";
import type { ResumeContent } from "./content";
import { EMPTY_PERSONAL, type ResumePersonalDetails } from "./types";

/**
 * A realistic, filled-in resume used ONLY for previews — the gallery
 * thumbnails and the full-screen template preview when the viewer has no
 * resume of their own yet. Plain constants: never written to the database,
 * never shown as if they were the user's real content.
 */

export const SAMPLE_PERSONAL: ResumePersonalDetails = {
  ...EMPTY_PERSONAL,
  fullName: "Ganesh Pache",
  jobTitle: "Software Engineer",
  email: "ganesh.pache@email.com",
  phone: "+91 98765 43210",
  location: "Pune, India",
  linkedin: "linkedin.com/in/ganeshpache",
  github: "github.com/ganeshpache",
};

export const SAMPLE_RESUME_CONTENT: ResumeContent = [
  {
    id: "s-summary",
    type: "summary",
    variant: "text",
    heading: "Summary",
    hidden: false,
    text: "Software engineer with 2+ years building and shipping full-stack web products. Strong in TypeScript, React and Node, with a track record of measurable performance and reliability wins. Comfortable owning a feature end to end, from design doc to on-call.",
  },
  {
    id: "s-exp",
    type: "experience",
    variant: "entries",
    heading: "Experience",
    hidden: false,
    entries: [
      {
        id: "s-exp-1",
        title: "Software Engineer",
        subtitle: "TechNova Solutions",
        location: "Pune",
        startDate: "2024",
        endDate: "Present",
        description:
          "Built a React + TypeScript component library adopted by 6 product teams, cutting new-screen build time ~40%\nReduced API p95 latency 38% with read-through caching and query batching\nLed migration of the billing service to typed event contracts, removing a recurring class of incidents",
        url: "",
        tags: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      },
      {
        id: "s-exp-2",
        title: "Software Engineer Intern",
        subtitle: "Acme Corp",
        location: "Remote",
        startDate: "2023",
        endDate: "2023",
        description: "Shipped the customer self-serve refunds flow end to end\nRaised payments-module test coverage from 55% to 86%",
        url: "",
        tags: [],
      },
    ],
  },
  {
    id: "s-proj",
    type: "projects",
    variant: "entries",
    heading: "Projects",
    hidden: false,
    entries: [
      {
        id: "s-proj-1",
        title: "CampusEduX Resume Builder",
        subtitle: "React, Next.js, Supabase",
        location: "",
        startDate: "",
        endDate: "",
        description: "ATS-scored resume editor with a live A4 preview and PDF/DOCX export",
        url: "",
        tags: [],
      },
      {
        id: "s-proj-2",
        title: "DevMetrics",
        subtitle: "Go, ClickHouse, Grafana",
        location: "",
        startDate: "",
        endDate: "",
        description: "Self-hosted engineering-metrics dashboard; ingests 2M events/day",
        url: "",
        tags: [],
      },
    ],
  },
  {
    id: "s-edu",
    type: "education",
    variant: "entries",
    heading: "Education",
    hidden: false,
    entries: [
      {
        id: "s-edu-1",
        title: "B.E. Computer Engineering",
        subtitle: "Pune Institute of Computer Technology",
        location: "Pune",
        startDate: "2019",
        endDate: "2023",
        description: "Score: 8.6 CGPA",
        url: "",
        tags: [],
      },
    ],
  },
  {
    id: "s-skills",
    type: "skills",
    variant: "tags",
    heading: "Skills",
    hidden: false,
    groups: [
      { id: "s-sk-1", label: "Technical", items: ["TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Go", "PostgreSQL", "Redis", "Docker", "AWS", "CI/CD"] },
      { id: "s-sk-2", label: "Soft", items: ["Communication", "Ownership", "Mentoring"] },
    ],
  },
  {
    id: "s-cert",
    type: "certifications",
    variant: "text",
    heading: "Certifications",
    hidden: false,
    text: "AWS Certified Developer – Associate (2025)",
  },
  {
    id: "s-ach",
    type: "achievements",
    variant: "text",
    heading: "Achievements",
    hidden: false,
    text: "Winner — Smart India Hackathon 2022 (out of 1,200+ teams)",
  },
];

export const SAMPLE_RESUME_MODEL: ResumeRenderModel = buildResumeRenderModel({
  personalDetails: SAMPLE_PERSONAL,
  content: SAMPLE_RESUME_CONTENT,
});
