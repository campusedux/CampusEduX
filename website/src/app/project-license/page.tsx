export const metadata = { title: "Project License" };

export default function ProjectLicensePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Project License</h1>
      <div className="empty-state mt-6">
        MANUAL IMPLEMENTATION / BUSINESS DECISION REQUIRED — the mobile app stores a per-project <code>license</code> value
        (e.g. &quot;Regular License&quot;, seen on project detail pages) but the exact terms of that license — what a buyer may
        and may not do with a project&apos;s source code and documentation, for academic vs. personal vs. business use, resale
        and redistribution rules — have not been written down anywhere in the repository. This page should not invent those
        terms. Please confirm the actual license terms with the CampusEduX owner, then either publish them here as static
        content or add a <code>project_license</code> key to <code>cms_pages</code> so they can be managed from the admin panel
        like Terms and Privacy already are.
      </div>
    </div>
  );
}
