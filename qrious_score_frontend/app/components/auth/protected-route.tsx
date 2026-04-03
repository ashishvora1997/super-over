"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (!token) {
      router.replace("/login");
    }
  }, [token, isInitialized, router]);

  if (!isInitialized) return null;

  if (!token) return null;

  return <>{children}</>;
}
