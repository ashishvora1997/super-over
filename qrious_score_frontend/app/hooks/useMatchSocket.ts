"use client";

import { useEffect, useRef } from "react";
import {
  getSocket,
  joinMatch,
  leaveMatch,
} from "@/app/services/socket.service";
import { useBallEventStore } from "@/app/store/ball-event.store";
import { useInningsStore } from "@/app/store/innings.store";
import { BallEvent, ScorecardData } from "@/app/types/ball-event.types";
import { Innings } from "@/app/types/innings.types";

interface BallRecordedPayload {
  ballEvent: BallEvent;
  innings: Innings;
  scorecard: ScorecardData | null;
}

interface BallUndonePayload {
  innings: Innings;
  removedEventId: number;
  scorecard: ScorecardData | null;
}

interface InningsPayload {
  innings: Innings;
}

export function useMatchSocket(matchId: number, enabled: boolean) {
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!enabled || !matchId) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    joinMatch(matchId);
    hasJoined.current = true;

    const handleBallRecorded = (data: BallRecordedPayload) => {
      const store = useBallEventStore.getState();

      const alreadyExists = store.ballEvents.some(
        (e) => e.id === data.ballEvent.id,
      );

      useBallEventStore.setState({
        ballEvents: alreadyExists
          ? store.ballEvents
          : [...store.ballEvents, data.ballEvent],
        currentInnings: data.innings,
        ...(data.scorecard ? { scorecard: data.scorecard } : {}),
      });

      useInningsStore.getState().updateInningsInArray(data.innings);
    };

    const handleBallUndone = (data: BallUndonePayload) => {
      const store = useBallEventStore.getState();

      useBallEventStore.setState({
        ballEvents: store.ballEvents.slice(0, -1),
        currentInnings: data.innings,
        ...(data.scorecard ? { scorecard: data.scorecard } : {}),
      });

      useInningsStore.getState().updateInningsInArray(data.innings);

      if (data.innings.match_id) {
        useInningsStore.getState().fetchInnings(data.innings.match_id);
      }
    };

    const handleInningsStarted = (data: InningsPayload) => {
      useBallEventStore.setState({
        currentInnings: data.innings,
      });
      useInningsStore.getState().updateInningsInArray(data.innings);
    };

    const handleInningsPlayersUpdated = (data: InningsPayload) => {
      useBallEventStore.setState({
        currentInnings: data.innings,
      });
      useInningsStore.getState().updateInningsInArray(data.innings);
    };

    socket.on("ball:recorded", handleBallRecorded);
    socket.on("ball:undone", handleBallUndone);
    socket.on("innings:started", handleInningsStarted);
    socket.on("innings:playersUpdated", handleInningsPlayersUpdated);

    return () => {
      socket.off("ball:recorded", handleBallRecorded);
      socket.off("ball:undone", handleBallUndone);
      socket.off("innings:started", handleInningsStarted);
      socket.off("innings:playersUpdated", handleInningsPlayersUpdated);

      if (hasJoined.current) {
        leaveMatch(matchId);
        hasJoined.current = false;
      }
    };
  }, [matchId, enabled]);
}
