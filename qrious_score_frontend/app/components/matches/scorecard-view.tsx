"use client";

import { useEffect, useState, useMemo } from "react";
import { Innings } from "@/app/types/innings.types";
import { Match } from "@/app/types/match.types";
import { BallEvent, ScorecardData } from "@/app/types/ball-event.types";
import {
  getScorecard,
  getBallEventsByInnings,
} from "@/app/services/ball-event.service";
import {
  formatOvers,
  currentRunRate,
  getBallLabel,
  getBallColor,
} from "@/app/utils/cricket.utils";

export function OverSummaryTimeline({
  ballEvents,
}: {
  ballEvents: BallEvent[];
}) {
  const overGroups = useMemo(() => {
    const groups: Record<number, BallEvent[]> = {};
    ballEvents.forEach((e) => {
      if (!groups[e.over_number]) groups[e.over_number] = [];
      groups[e.over_number].push(e);
    });
    return groups;
  }, [ballEvents]);

  const completedOvers = Object.entries(overGroups).filter(([, balls]) => {
    const legalBalls = balls.filter((b) => b.is_legal);
    return legalBalls.length >= 6;
  });

  if (completedOvers.length === 0) return null;

  return (
    <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
        Over Summary
      </span>
      <div className="space-y-2 mt-2">
        {completedOvers.map(([overNum, balls]) => {
          const runs = balls.reduce((s, b) => s + b.runs_bat + b.runs_extra, 0);
          const wickets = balls.filter((b) => b.is_wicket).length;
          return (
            <div
              key={overNum}
              className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0"
            >
              <span className="text-[10px] font-bold text-muted w-12 flex-shrink-0">
                Over {Number(overNum) + 1}
              </span>
              <div className="flex items-center gap-1 flex-wrap flex-1">
                {balls.map((b) => (
                  <span
                    key={b.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ring-1 ${getBallColor(b)}`}
                  >
                    {getBallLabel(b)}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-semibold text-foreground flex-shrink-0">
                {runs} runs{wickets > 0 ? `, ${wickets}W` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ViewerScoreboardView({
  inn,
  matchDetail,
  scorecard,
  ballEvents,
  allInnings,
  showHeader = true,
}: {
  inn: Innings;
  matchDetail: Match;
  scorecard: ScorecardData | null;
  ballEvents: BallEvent[];
  allInnings: Innings[];
  showHeader?: boolean;
}) {
  const battingPlayers =
    inn.batting_team_id === matchDetail.team_a_id
      ? (matchDetail.teamA?.players ?? [])
      : (matchDetail.teamB?.players ?? []);

  const firstInnings = allInnings.find((i) => i.innings_number === 1);

  let target: number | null = null;
  if (inn.innings_number === 2 && firstInnings) {
    target = firstInnings.total_runs + 1;
  } else if (inn.is_super_over && inn.innings_number % 2 === 0) {
    const firstSuperOverInnings = allInnings.find(
      (i) =>
        i.is_super_over &&
        i.super_over_number === inn.super_over_number &&
        i.innings_number === inn.innings_number - 1,
    );
    if (firstSuperOverInnings) {
      target = firstSuperOverInnings.total_runs + 1;
    }
  }

  const maxBallsForInnings = inn.is_super_over
    ? 6
    : (matchDetail.overs_per_side ?? 20) * 6;
  const totalBallsBowled = inn.overs * 6 + inn.balls;
  const totalBallsRemaining =
    target !== null ? maxBallsForInnings - totalBallsBowled : null;
  const runsNeeded = target !== null ? target - inn.total_runs : null;
  const reqRR =
    totalBallsRemaining && totalBallsRemaining > 0 && runsNeeded !== null
      ? ((runsNeeded / totalBallsRemaining) * 6).toFixed(2)
      : null;

  const dismissedIds = ballEvents
    .filter((e) => e.is_wicket && e.dismissed_player_id)
    .map((e) => e.dismissed_player_id!);
  const toBat = battingPlayers.filter(
    (p) =>
      !dismissedIds.includes(p.id) &&
      p.id !== inn.striker_id &&
      p.id !== inn.non_striker_id,
  );

  const currentOverBalls = ballEvents.filter(
    (e) => e.over_number === inn.overs,
  );

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-5 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.1),transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                {matchDetail.tournament?.name ?? "Match"} · Innings{" "}
                {inn.innings_number}
              </span>
              {inn.status === "completed" ? (
                <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2.5 py-1 rounded-full border border-white/10">
                  Completed
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-accent/20 text-accent-light px-2.5 py-1 rounded-full border border-accent/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {(firstInnings && inn.innings_number === 2) ||
            (inn.is_super_over && inn.innings_number % 2 === 0) ? (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">
                    {inn.innings_number === 2
                      ? firstInnings?.battingTeam?.name
                      : allInnings.find(
                          (i) => i.innings_number === inn.innings_number - 1,
                        )?.battingTeam?.name}
                  </span>
                  <span className="text-sm font-bold text-white/60">
                    Target: {target} runs
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/70">
                {inn.battingTeam?.name}
              </span>
              {inn.status === "in_progress" && (
                <span className="text-[10px] font-bold bg-accent/20 text-accent-light px-2 py-0.5 rounded-full">
                  Batting
                </span>
              )}
            </div>
            <div className="flex items-end justify-between mt-1">
              <p className="text-4xl font-black tracking-tight leading-none">
                {inn.total_runs}
                <span className="text-xl text-white/50 font-bold">
                  /{inn.wickets}
                </span>
              </p>
              <p className="text-lg font-bold text-white/70 leading-none">
                ({formatOvers(inn.overs, inn.balls)}/
                {matchDetail.overs_per_side ?? 20} Ov)
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 flex-wrap">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  CRR
                </span>
                <p className="text-sm font-bold">
                  {currentRunRate(inn.total_runs, inn.overs, inn.balls)}
                </p>
              </div>
              {reqRR && (
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">
                    REQ
                  </span>
                  <p className="text-sm font-bold">{reqRR}</p>
                </div>
              )}
              {runsNeeded !== null &&
                runsNeeded > 0 &&
                totalBallsRemaining !== null && (
                  <p className="text-xs text-accent-light font-semibold">
                    Need {runsNeeded} runs in {totalBallsRemaining} balls
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {scorecard && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
            <span className="text-xs font-bold text-foreground">Batters</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-4 font-semibold text-muted w-[35%]">
                    Batter
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    R
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    B
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    4s
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    6s
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-muted">
                    SR
                  </th>
                </tr>
              </thead>
              <tbody>
                {scorecard.batting
                  .filter((b) => b.balls_faced > 0 || b.is_out)
                  .map((b) => {
                    const isStriker = b.player_id === inn.striker_id;
                    return (
                      <tr
                        key={b.player_id}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="py-2 px-4">
                          <span
                            className={`font-semibold ${isStriker ? "text-primary" : "text-foreground"}`}
                          >
                            {b.player_name}
                            {isStriker ? "*" : ""}
                          </span>
                          {b.is_out && (
                            <p className="text-[10px] text-muted">
                              {b.wicket_type}
                              {b.bowler_name ? ` b ${b.bowler_name}` : ""}
                            </p>
                          )}
                          {!b.is_out && (
                            <p className="text-[10px] text-accent-dark">
                              not out
                            </p>
                          )}
                        </td>
                        <td className="text-center py-2 px-1 font-bold text-foreground">
                          {b.runs}
                        </td>
                        <td className="text-center py-2 px-1 text-muted">
                          {b.balls_faced}
                        </td>
                        <td className="text-center py-2 px-1 text-muted">
                          {b.fours}
                        </td>
                        <td className="text-center py-2 px-1 text-muted">
                          {b.sixes}
                        </td>
                        <td className="text-center py-2 px-2 font-semibold text-muted">
                          {b.strike_rate.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted">Extras</span>
            <span className="text-xs font-semibold text-foreground">
              {scorecard.extras.total}
              <span className="text-[10px] text-muted ml-1">
                (wd {scorecard.extras.wides}, nb {scorecard.extras.no_balls}, b{" "}
                {scorecard.extras.byes}, lb {scorecard.extras.leg_byes})
              </span>
            </span>
          </div>
          <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-bold text-foreground">Total</span>
            <span className="text-xs font-bold text-foreground">
              {inn.total_runs}/{inn.wickets} (
              {formatOvers(inn.overs, inn.balls)}/
              {matchDetail.overs_per_side ?? 20} Ov) &nbsp; CRR{" "}
              {currentRunRate(inn.total_runs, inn.overs, inn.balls)}
            </span>
          </div>
        </div>
      )}

      {toBat.length > 0 && (
        <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            To bat
          </span>
          <p className="text-xs text-muted mt-1">
            {toBat.map((p) => p.name).join(", ")}
          </p>
        </div>
      )}

      {scorecard && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
            <span className="text-xs font-bold text-foreground">Bowlers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-4 font-semibold text-muted w-[35%]">
                    Bowler
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    O
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    M
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    R
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-muted">
                    W
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-muted">
                    Eco
                  </th>
                </tr>
              </thead>
              <tbody>
                {scorecard.bowling.map((b) => {
                  const isCurrent = b.player_id === inn.bowler_id;
                  return (
                    <tr
                      key={b.player_id}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td
                        className={`py-2 px-4 font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}
                      >
                        {b.player_name}
                        {isCurrent ? "*" : ""}
                      </td>
                      <td className="text-center py-2 px-1 text-muted">
                        {b.overs}
                      </td>
                      <td className="text-center py-2 px-1 text-muted">
                        {b.maidens}
                      </td>
                      <td className="text-center py-2 px-1 text-muted">
                        {b.runs_conceded}
                      </td>
                      <td className="text-center py-2 px-1 font-bold text-foreground">
                        {b.wickets}
                      </td>
                      <td className="text-center py-2 px-2 font-semibold text-muted">
                        {b.economy.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            This Over
          </span>
          <span className="text-[10px] text-muted">Over {inn.overs + 1}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
          {currentOverBalls.length === 0 ? (
            <span className="text-xs text-muted/50">No balls yet</span>
          ) : (
            currentOverBalls.map((event) => (
              <div
                key={event.id}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ${getBallColor(event)}`}
              >
                {getBallLabel(event)}
              </div>
            ))
          )}
        </div>
      </div>

      <OverSummaryTimeline ballEvents={ballEvents} />
    </div>
  );
}

export function ViewerScoreboardContainer({
  allInnings,
  matchDetail,
  showHeader = true,
  onInningsChange,
}: {
  allInnings: Innings[];
  matchDetail: Match;
  showHeader?: boolean;
  onInningsChange?: (innings: Innings) => void;
}) {
  const defaultInnings =
    allInnings.find((i) => i.status === "in_progress") ||
    allInnings[allInnings.length - 1];

  const [selectedInningsId, setSelectedInningsId] = useState<number | null>(
    defaultInnings?.id ?? null,
  );

  const [data, setData] = useState<
    Record<number, { scorecard: ScorecardData | null; ballEvents: BallEvent[] }>
  >({});

  useEffect(() => {
    if (!selectedInningsId) return;

    const fetchData = async () => {
      try {
        const [scRes, beRes] = await Promise.all([
          getScorecard(selectedInningsId),
          getBallEventsByInnings(selectedInningsId),
        ]);
        setData((prev) => ({
          ...prev,
          [selectedInningsId]: {
            scorecard: scRes.data,
            ballEvents: beRes.data,
          },
        }));
      } catch (err) {}
    };

    fetchData();
  }, [selectedInningsId]);

  useEffect(() => {
    if (!selectedInningsId) return;

    let cleanup: (() => void) | undefined;

    import("@/app/services/socket.service").then(
      ({ getSocket, joinMatch, leaveMatch }) => {
        const socket = getSocket();
        if (!socket.connected) socket.connect();
        joinMatch(matchDetail.id);

        const handleBallRecorded = (payload: {
          ballEvent: BallEvent;
          innings: Innings;
          scorecard: ScorecardData | null;
        }) => {
          if (payload.innings.id !== selectedInningsId) return;
          setData((prev) => {
            const existing = prev[selectedInningsId] || {
              scorecard: null,
              ballEvents: [],
            };
            const alreadyExists = existing.ballEvents.some(
              (e) => e.id === payload.ballEvent.id,
            );
            return {
              ...prev,
              [selectedInningsId]: {
                scorecard: payload.scorecard ?? existing.scorecard,
                ballEvents: alreadyExists
                  ? existing.ballEvents
                  : [...existing.ballEvents, payload.ballEvent],
              },
            };
          });
        };

        const handleBallUndone = (payload: {
          innings: Innings;
          scorecard: ScorecardData | null;
        }) => {
          if (payload.innings.id !== selectedInningsId) return;
          getBallEventsByInnings(selectedInningsId)
            .then((beRes) => {
              setData((prev) => ({
                ...prev,
                [selectedInningsId]: {
                  scorecard:
                    payload.scorecard ??
                    prev[selectedInningsId]?.scorecard ??
                    null,
                  ballEvents: beRes.data,
                },
              }));
            })
            .catch(() => {
              setData((prev) => {
                const existing = prev[selectedInningsId] || {
                  scorecard: null,
                  ballEvents: [],
                };
                return {
                  ...prev,
                  [selectedInningsId]: {
                    scorecard: payload.scorecard ?? existing.scorecard,
                    ballEvents: existing.ballEvents.slice(0, -1),
                  },
                };
              });
            });
        };

        socket.on("ball:recorded", handleBallRecorded);
        socket.on("ball:undone", handleBallUndone);

        cleanup = () => {
          socket.off("ball:recorded", handleBallRecorded);
          socket.off("ball:undone", handleBallUndone);
          leaveMatch(matchDetail.id);
        };
      },
    );

    return () => {
      cleanup?.();
    };
  }, [selectedInningsId, matchDetail.id]);

  useEffect(() => {
    if (allInnings.length === 0) return;

    const stillExists = allInnings.find((i) => i.id === selectedInningsId);
    if (!stillExists) {
      const latestInnings = allInnings[allInnings.length - 1];
      setSelectedInningsId(latestInnings.id);
    }
  }, [allInnings]);

  if (allInnings.length === 0) return null;

  const selectedInnings =
    allInnings.find((i) => i.id === selectedInningsId) || allInnings[0];

  useEffect(() => {
    if (onInningsChange && selectedInnings) {
      onInningsChange(selectedInnings);
    }
  }, [selectedInnings?.id]);

  const selectedData = data[selectedInnings.id] || {
    scorecard: null,
    ballEvents: [],
  };

  return (
    <div className="space-y-3">
      {allInnings.length > 1 && (
        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1 overflow-x-auto">
          {allInnings.map((inn) => {
            const isSuperOver = inn.is_super_over || inn.innings_number > 2;
            const teamName =
              inn.battingTeam?.name ||
              (inn.batting_team_id === matchDetail.team_a_id
                ? matchDetail.teamA?.name
                : matchDetail.teamB?.name) ||
              `Team ${inn.batting_team_id}`;
            const shortName = teamName.slice(0, 3).toUpperCase();

            return (
              <button
                key={inn.id}
                onClick={() => {
                  setSelectedInningsId(inn.id);
                  onInningsChange?.(inn);
                }}
                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all min-w-[80px] whitespace-nowrap ${
                  selectedInningsId === inn.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {isSuperOver ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[10px]">🎯</span>
                    {shortName}
                    {inn.super_over_number > 1 && ` ${inn.super_over_number}`}
                  </span>
                ) : (
                  <span>{shortName}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ViewerScoreboardView
        inn={selectedInnings}
        matchDetail={matchDetail}
        scorecard={selectedData.scorecard}
        ballEvents={selectedData.ballEvents}
        allInnings={allInnings}
        showHeader={showHeader}
      />
    </div>
  );
}
