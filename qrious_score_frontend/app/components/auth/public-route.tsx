"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (token) {
      router.replace("/dashboard");
    }
  }, [token, isInitialized, router]);

  if (!isInitialized) return null;

  return <>{children}</>;
}
