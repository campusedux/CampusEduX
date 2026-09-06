import type {
  ResumeSummary,
  ResumeDocument,
  ResumeTemplate,
  ATSBreakdown,
  ResumeDownloadRecord,
} from "@/types";
import { RESUME_FREEFORM_SECTIONS, MANAGEABLE_RESUME_SECTIONS } from "@/types";
import { normalizeResumeContent } from "@/services/resumeContent";

/**
 * Sample content for Module 6 (Resume Builder). Each resume service read
 * tries Supabase first and falls back here so the 10 screens render like the
 * mockups before the database is seeded.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const SAMPLE_RESUME_LIST: ResumeSummary[] = [
  { id: "res-1", title: "Software Engineer Resume", template: "modern", atsScore: 85, updatedAt: daysAgo(2) },
  { id: "res-2", title: "Full Stack Developer Resume", template: "professional", atsScore: 78, updatedAt: daysAgo(4) },
  { id: "res-3", title: "Data Analyst Resume", template: "minimal", atsScore: 72, updatedAt: daysAgo(7) },
  { id: "res-4", title: "Frontend Developer Resume", template: "creative", atsScore: 80, updatedAt: daysAgo(12) },
  { id: "res-5", title: "Backend Developer Resume", template: "modern", atsScore: 75, updatedAt: daysAgo(20) },
];

const emptySections = () =>
  RESUME_FREEFORM_SECTIONS.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {} as ResumeDocument["sections"]);

export function sampleResumeDetail(resumeId: string): ResumeDocument {
  const summary = SAMPLE_RESUME_LIST.find((r) => r.id === resumeId);
  const template: ResumeTemplate = summary?.template ?? "modern";

  const personalDetails = {
    fullName: "Alex Johnson",
    jobTitle: "Software Engineer",
    email: "alex.johnson@email.com",
    phone: "+91 98765 43210",
    location: "Bangalore, India",
    linkedin: "linkedin.com/in/alexjohnson",
    github: "github.com/alexjohnson",
    website: "alexjohnson.dev",
    photoUrl: null,
  };

  const education: ResumeDocument["education"] = [
    {
      id: "edu-1",
      degree: "Bachelor of Technology, Computer Science Engineering",
      institution: "R V College of Engineering, Bangalore",
      startYear: "2020",
      endYear: "2024",
      percentage: "8.2",
    },
    {
      id: "edu-2",
      degree: "Higher Secondary (12th)",
      institution: "Kendriya Vidyalaya, Bangalore",
      startYear: "2018",
      endYear: "2020",
      percentage: "92",
    },
  ];

  const skills = {
    technical: ["JavaScript", "TypeScript", "React.js", "Node.js", "Express.js", "MongoDB", "Python", "SQL", "Git", "Docker"],
    soft: ["Problem Solving", "Communication", "Teamwork", "Time Management", "Adaptability", "Leadership"],
  };

  const sections = {
    ...emptySections(),
    summary:
      "Software Engineer with a strong foundation in full-stack web development and a track record of shipping clean, well-tested features. Passionate about building products that scale and mentoring newer teammates.",
    experience:
      "Software Engineer Intern — Acme Corp (Jun 2023 - Dec 2023)\n- Built responsive UI components with React and TypeScript\n- Implemented REST APIs in Node.js and Express, reducing average response time by 30%\n- Wrote unit and integration tests, raising coverage from 55% to 85%",
    projects:
      "E-Commerce Website — React, Node.js, MongoDB\n- Developed a full-stack shopping app with cart, checkout and payment integration\n- Designed the admin panel and product management flow",
    certifications: "AWS Certified Cloud Practitioner (2024)",
    achievements: "Winner, Smart India Hackathon 2023",
    languages: "English (Fluent), Hindi (Native)",
  };

  const layout = { order: [...MANAGEABLE_RESUME_SECTIONS], hidden: [] };

  return {
    id: resumeId,
    title: summary?.title ?? "Software Engineer Resume",
    template,
    personalDetails,
    content: normalizeResumeContent(undefined, { sections, education, skills, layout }),
    isDemo: false,
    design: {},
    education,
    skills,
    sections,
    atsScore: summary?.atsScore ?? 85,
    layout,
    updatedAt: summary?.updatedAt ?? daysAgo(2),
  };
}

export function sampleATSBreakdown(resumeId: string): ATSBreakdown {
  const overall = SAMPLE_RESUME_LIST.find((r) => r.id === resumeId)?.atsScore ?? 85;
  return {
    overall,
    content: 90,
    formatting: 80,
    skills: 85,
    keywords: 85,
    completeness: 90,
    readability: 95,
    tips: [
      {
        ruleId: null,
        section: "general",
        problem: "Great! Your resume has a high chance of passing ATS screening.",
        why: "",
        importance: "low",
        checked: true,
      },
    ],
  };
}

export function sampleResumeDownloadHistory(): ResumeDownloadRecord[] {
  return [
    { id: "rd-1", resumeId: "res-1", resumeTitle: "Software Engineer Resume", fileUrl: "", downloadedAt: daysAgo(2) },
    { id: "rd-2", resumeId: "res-2", resumeTitle: "Full Stack Developer Resume", fileUrl: "", downloadedAt: daysAgo(9) },
    { id: "rd-3", resumeId: "res-3", resumeTitle: "Data Analyst Resume", fileUrl: "", downloadedAt: daysAgo(15) },
  ];
}
