"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlayersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-cricket");
  }, [router]);

  return null;
}
