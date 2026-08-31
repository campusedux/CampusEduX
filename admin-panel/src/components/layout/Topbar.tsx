import type { AdminUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/permissions';
import { initials } from '@/lib/utils';

export function Topbar({ admin }: { admin: AdminUser }) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-ink">{admin.fullName}</p>
          <p className="text-xs text-ink-muted">{ROLE_LABEL[admin.role]}</p>
        </div>
        {admin.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={admin.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
            {initials(admin.fullName)}
          </div>
        )}
      </div>
    </header>
  );
}
