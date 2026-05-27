"use client";

import { useEffect } from "react";
import { getSocket } from "@/app/services/socket.service";
import { useMatchStore } from "@/app/store/matches.store";

export function useLiveMatchUpdates(liveMatchIds: number[]) {
  useEffect(() => {
    if (liveMatchIds.length === 0) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    liveMatchIds.forEach((id) => socket.emit("joinMatch", id));

    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        useMatchStore.getState().fetchMatches();
      }, 500);
    };

    socket.on("ball:recorded", debouncedRefresh);
    socket.on("ball:undone", debouncedRefresh);
    socket.on("innings:started", debouncedRefresh);
    socket.on("innings:playersUpdated", debouncedRefresh);

    return () => {
      socket.off("ball:recorded", debouncedRefresh);
      socket.off("ball:undone", debouncedRefresh);
      socket.off("innings:started", debouncedRefresh);
      socket.off("innings:playersUpdated", debouncedRefresh);

      liveMatchIds.forEach((id) => socket.emit("leaveMatch", id));

      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [liveMatchIds.join(",")]);
}
