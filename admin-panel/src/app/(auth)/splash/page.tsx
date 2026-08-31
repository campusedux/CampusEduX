'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';

/**
 * Admin Splash — dark purple full-bleed, logo, tagline, indeterminate loading
 * bar, then hands off to /login (the panel layout takes over from there for an
 * already-signed-in admin).
 */
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/login'), 1900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1E1550] px-6 text-center">
      <div className="rounded-2xl bg-white/95 px-6 py-5 shadow-2xl">
        <Logo />
      </div>
      <p className="mt-8 max-w-sm text-lg font-semibold text-white">Powerful Platform. Seamless Management.</p>
      <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/3 animate-load-bar rounded-full bg-white/80" />
      </div>
    </div>
  );
}
