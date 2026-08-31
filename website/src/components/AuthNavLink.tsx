"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function AuthNavLink() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (signedIn === null) return <span className="w-16" />;

  return signedIn ? (
    <Link href="/account" className="rounded-sm border border-navy px-3 py-1.5 text-sm text-navy hover:bg-navy hover:text-paper">
      My Account
    </Link>
  ) : (
    <Link href="/login" className="rounded-sm border border-navy px-3 py-1.5 text-sm text-navy hover:bg-navy hover:text-paper">
      Sign in
    </Link>
  );
}
