import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * Split-screen auth shell: brand panel + illustration on the left, the form
 * card on the right. Used by every Module 1 screen so they read as one flow.
 */
export function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand / illustration */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#1E1550] p-12 lg:flex">
        <div className="rounded-2xl bg-white/95 px-5 py-4 shadow-xl w-fit">
          <Logo />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Powerful Platform.
            <br />
            Seamless Management.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/60">
            One portal for students, projects, jobs, placement prep, the resume builder, orders, referrals and
            everything the CampusEduX app shows.
          </p>
        </div>

        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#3A2A8F]/60 blur-3xl" />

        <p className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={14} /> Secure Admin Access
        </p>
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-ink-faint lg:hidden">Secure Admin Access</p>
        </div>
      </div>
    </div>
  );
}
