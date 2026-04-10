"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";

export default function HomePage() {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (token) {
      window.location.href = "/dashboard";
    } else {
      router.replace("/login");
    }
  }, [isInitialized, token, router]);

  return null;
}
