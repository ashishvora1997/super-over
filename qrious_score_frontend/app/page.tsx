"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";

export default function HomePage() {
  const router = useRouter();
  const { token, isInitialized, loadUserFromStorage } = useAuthStore();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [token, isInitialized]);

  if (!isInitialized) return null;

  return null;
}
