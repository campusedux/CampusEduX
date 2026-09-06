import { Trash2 } from "lucide-react";
import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";
import { LEGAL } from "@/legal/config";

export const metadata = legalMetadata("delete-account");

export default function Page() {
  return (
    <LegalDocView docId="delete-account">
      <div className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Trash2 className="h-4 w-4 flex-shrink-0 text-danger" aria-hidden />
          Deleting from the web
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          Account deletion runs inside the CampusEduX mobile app — open{" "}
          <strong className="font-semibold text-ink">Settings → Delete Account</strong> while signed in and confirm. If
          you cannot use the app, email{" "}
          <a
            className="text-primary underline underline-offset-2 hover:no-underline"
            href={`mailto:${LEGAL.privacyEmail}?subject=Delete%20my%20account`}
          >
            {LEGAL.privacyEmail}
          </a>{" "}
          from your registered email address (see “If you cannot use the app”, below). The deletion itself — what is
          removed and what is kept — is identical either way.
        </p>
      </div>
    </LegalDocView>
  );
}
