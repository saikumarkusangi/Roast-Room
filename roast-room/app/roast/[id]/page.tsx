"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — roast now runs on the homepage arena. */
export default function RoastRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="font-poster uppercase tracking-[0.2em] text-[var(--text-dim)] text-sm">
        Returning to the arena…
      </p>
    </main>
  );
}
