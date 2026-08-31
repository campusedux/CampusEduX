import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-8 md:grid-cols-[210px_1fr]">
        <aside>
          <div className="mb-4">
            <div className="font-bold text-ink">{user.fullName || user.email}</div>
            {user.isPremium && (
              <span className="mt-1 inline-block">
                <Badge tone="premium">Premium</Badge>
              </span>
            )}
          </div>
          <AccountNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
