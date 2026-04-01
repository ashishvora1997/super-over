"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadUserFromStorage = useAuthStore(
    (state) => state.loadUserFromStorage,
  );

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  return <>{children}</>;
}
