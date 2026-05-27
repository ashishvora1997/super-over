"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-cricket?tab=teams");
  }, [router]);

  return null;
}
