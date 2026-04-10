"use client";

import { useAuthStore } from "@/app/store/auth.store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  return <>{children}</>;
}
