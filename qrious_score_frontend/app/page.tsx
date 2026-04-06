"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "./store/auth.store";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { token, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    router.replace(token ? "/dashboard" : "/login");
  }, [token, isInitialized]);

  return null;
}
