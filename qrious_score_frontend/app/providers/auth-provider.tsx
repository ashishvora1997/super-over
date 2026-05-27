"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/auth.store";

import { refreshAccessToken } from "@/app/services/auth.service";
import { getCurrentUser } from "@/app/services/users.service";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    const initializeAuth = async () => {
      const { accessToken, user } = useAuthStore.getState();
      if (accessToken && user) {
        setLoading(false);
        return;
      }

      try {
        const refreshRes = await refreshAccessToken();
        const newAccessToken = refreshRes.data.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);

        const userRes = await getCurrentUser();

        setAuth({
          user: userRes.data.user,
          accessToken: newAccessToken,
        });
      } catch {
        clearAuth();
      }
    };

    initializeAuth();
  }, [setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}
