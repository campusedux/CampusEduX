import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/primitives';

/**
 * Temporary stand-in for a module whose screens are scheduled for a later
 * build phase. Keeps the sidebar link resolving (no 404s) and the shell
 * consistent while the modules are built in order.
 */
export function ModulePlaceholder({
  title,
  subtitle,
  phase,
}: {
  title: string;
  subtitle: string;
  phase: number;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState
        title={`${title} lands in build phase ${phase}`}
        description="Modules are being built incrementally and reviewed one at a time. The auth flow, sidebar shell and Dashboard ship first."
      />
    </div>
  );
}
