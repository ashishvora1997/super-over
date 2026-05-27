"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-cricket?tab=matches");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm font-medium">
          Redirecting to My Cricket...
        </p>
      </div>
    </div>
  );
}
