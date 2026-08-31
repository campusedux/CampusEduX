import type { OwnedProjectDetail, ProjectFile, ProjectVersionChange } from "@/types";
import { SAMPLE_ALL_PROJECTS } from "./sampleProjectContent";

/**
 * Sample content for Module 7 (My Projects). Every myProjects service read
 * tries Supabase first and falls back here so the 8 screens render like the
 * mockups before the database is seeded.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export function sampleOwnedProjectDetail(orderId: string): OwnedProjectDetail {
  const project =
    SAMPLE_ALL_PROJECTS.find((p) => orderId.includes(p.id)) ?? SAMPLE_ALL_PROJECTS[0];
  return {
    orderId,
    project,
    purchasedAt: daysAgo(9),
    license: "Regular License",
    developerName: "CodeCraft Solutions",
    purchasedVersion: "2.1",
    latestVersion: "2.2",
    isUpdateAvailable: true,
    githubUrl: "https://github.com/codecraft-solutions/ecommerce-web-app",
    repo: {
      owner: "codecraft-solutions",
      name: "ecommerce-web-app",
      language: "JavaScript",
      stars: 128,
      forks: 45,
      updatedAt: daysAgo(15),
    },
  };
}

export function sampleProjectFiles(projectId: string, category: "main" | "documentation"): ProjectFile[] {
  if (category === "documentation") {
    return [
      { id: "doc-1", projectId, category, label: "Installation Guide.pdf", fileName: "installation-guide.pdf", sizeMB: 2.4, url: "" },
      { id: "doc-2", projectId, category, label: "User Manual.pdf", fileName: "user-manual.pdf", sizeMB: 3.1, url: "" },
      { id: "doc-3", projectId, category, label: "Admin Panel Guide.pdf", fileName: "admin-panel-guide.pdf", sizeMB: 2.8, url: "" },
      { id: "doc-4", projectId, category, label: "API Documentation.pdf", fileName: "api-documentation.pdf", sizeMB: 1.6, url: "" },
      { id: "doc-5", projectId, category, label: "Environment Setup.pdf", fileName: "environment-setup.pdf", sizeMB: 1.2, url: "" },
      { id: "doc-6", projectId, category, label: "Frequently Asked Questions.pdf", fileName: "faq.pdf", sizeMB: 0.9, url: "" },
    ];
  }
  return [
    { id: "main-1", projectId, category, label: "Source Code (Full Project)", fileName: "source-code.zip", sizeMB: 245, url: "" },
    { id: "main-2", projectId, category, label: "Admin Panel", fileName: "admin-panel.zip", sizeMB: 89, url: "" },
    { id: "main-3", projectId, category, label: "User Panel", fileName: "user-panel.zip", sizeMB: 72, url: "" },
    { id: "main-4", projectId, category, label: "Database Files (SQL)", fileName: "database.sql", sizeMB: 15, url: "" },
    { id: "main-5", projectId, category, label: "Documentation (PDF)", fileName: "documentation.pdf", sizeMB: 3.2, url: "" },
    { id: "main-6", projectId, category, label: "Environment Setup", fileName: "env-setup.zip", sizeMB: 1.1, url: "" },
  ];
}

export function sampleVersionHistory(): ProjectVersionChange[] {
  return [
    {
      version: "2.2",
      isLatest: true,
      releasedAt: daysAgo(3),
      sizeMB: 256,
      changelog: ["New Payment Gateway Integration", "Improved UI/UX", "Bug Fixes and Performance Improvements", "Added Dark Mode"],
    },
    {
      version: "2.1",
      isLatest: false,
      releasedAt: daysAgo(13),
      sizeMB: 245,
      changelog: ["Added Product Reviews", "Improved Checkout Flow", "Minor Bug Fixes"],
    },
    {
      version: "2.0",
      isLatest: false,
      releasedAt: daysAgo(28),
      sizeMB: 230,
      changelog: ["Initial Release", "User & Admin Panel", "Basic E-Commerce Features"],
    },
    {
      version: "1.0",
      isLatest: false,
      releasedAt: daysAgo(43),
      sizeMB: 120,
      changelog: ["Project Setup", "Basic Structure"],
    },
  ];
}
