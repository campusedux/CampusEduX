import { redirect } from "next/navigation";

/** The résumé dashboard now lives at /resume — keep old links working. */
export default function AccountResumeRedirect() {
  redirect("/resume");
}
