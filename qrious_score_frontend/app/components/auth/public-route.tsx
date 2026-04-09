"use client";

import { useAuthStore } from "@/app/store/auth.store";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  return <>{children}</>;
}
