import { cn } from '@/lib/utils';

/**
 * CampusEduX wordmark. Purple rounded "C" tile + "Campus" in the current text
 * colour and "EduX" in brand purple, with an optional "Admin Panel" subtitle
 * (per the login / splash screens).
 */
export function Logo({
  subtitle = true,
  onDark = false,
  className,
}: {
  subtitle?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand text-base font-black text-white">
        C
      </span>
      <span className="leading-tight">
        <span className={cn('block text-[15px] font-bold tracking-tight', onDark ? 'text-white' : 'text-ink')}>
          Campus<span className="text-brand">EduX</span>
        </span>
        {subtitle ? (
          <span className={cn('block text-[11px] font-medium', onDark ? 'text-white/45' : 'text-ink-faint')}>
            Admin Panel
          </span>
        ) : null}
      </span>
    </div>
  );
}
