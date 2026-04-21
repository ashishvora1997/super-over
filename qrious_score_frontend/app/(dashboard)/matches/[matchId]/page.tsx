"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, CalendarDays, Swords, Trophy, Zap, Eye } from "lucide-react";
import { useAuthStore } from "@/app/store/auth.store";
import { useTossStore } from "@/app/store/toss.store";
import { useInningsStore } from "@/app/store/innings.store";
import { useMatchStore } from "@/app/store/matches.store";
import { TossSection } from "@/app/components/toss/toss-section";
import { InningsCard } from "@/app/components/innings/innings-card";
import { Match } from "@/app/types/match.types";
import { getMatchById } from "@/app/services/matches.service";

function MatchDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-28 w-full bg-gray-200 rounded-2xl animate-pulse" />
      <div className="h-20 w-full bg-gray-200 rounded-2xl animate-pulse" />
      <div className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse" />
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);
  const [matchDetail, setMatchDetail] = useState<Match | null>(null);
  const user = useAuthStore((state) => state.user);

  const { matches, fetchMatches } = useMatchStore();
  const {
    toss,
    loading: tossLoading,
    fetchToss,
    reset: resetToss,
  } = useTossStore();
  const {
    innings,
    loading: inningsLoading,
    fetchInnings,
    reset: resetInnings,
  } = useInningsStore();

  console.log("Matches::", matches);
  const match = matches.find((m) => m.id === matchId);

  console.log("single Match::", match);
  useEffect(() => {
    if (!matches.length) fetchMatches();
    fetchToss(matchId);
    fetchInnings(matchId);

    getMatchById(matchId).then((res) => setMatchDetail(res.data));

    return () => {
      resetToss();
      resetInnings();
    };
  }, [matchId]);

  if (!match || tossLoading || inningsLoading || !matchDetail) {
    return <MatchDetailSkeleton />;
  }

  const teamAPlayers = matchDetail?.teamA?.players ?? [];
  const teamBPlayers = matchDetail?.teamB?.players ?? [];

  console.log("team A player", teamAPlayers);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <a
          href="/matches"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← Matches
        </a>
        <span className="text-xs text-muted">/</span>
        <span className="text-xs font-medium text-foreground">
          Match detail
        </span>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        {match.tournament && (
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy size={12} className="text-muted" />
            <span className="text-xs font-medium text-muted">
              {match.tournament.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0">
              {match.teamA?.name.slice(0, 3).toUpperCase()}
            </div>
            <p className="text-sm font-bold text-foreground truncate">
              {match.teamA?.name}
            </p>
          </div>
          <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Swords size={14} className="text-muted" strokeWidth={1.75} />
          </div>
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <p className="text-sm font-bold text-foreground truncate text-right">
              {match.teamB?.name}
            </p>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0">
              {match.teamB?.name.slice(0, 3).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {match.match_date && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <CalendarDays size={11} />
              <span>
                {new Date(match.match_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} />
              <span>{match.venue}</span>
            </div>
          )}
        </div>
      </div>

      <TossSection match={match} />

      {innings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Innings</h3>
            {(() => {
              const isLive = innings.some((i) => i.status === "in_progress");
              const isScorer =
                user?.role === "admin" || user?.role === "scorer";
              const showScoringBtn = isScorer && isLive;

              return (
                <button
                  onClick={() => router.push(`/matches/${matchId}/scoring`)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 hover:shadow-lg ${
                    showScoringBtn
                      ? "bg-gradient-to-r from-accent to-accent-dark shadow-accent/25"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/25"
                  }`}
                >
                  {showScoringBtn ? <Zap size={13} /> : <Eye size={13} />}
                  {showScoringBtn ? "Start Scoring" : "View Scoreboard"}
                </button>
              );
            })()}
          </div>
          {innings.map((inn) => {
            const battingPlayers =
              inn.batting_team_id === matchDetail.team_a_id
                ? teamAPlayers
                : teamBPlayers;
            const bowlingPlayers =
              inn.bowling_team_id === matchDetail.team_a_id
                ? teamAPlayers
                : teamBPlayers;

            return (
              <InningsCard
                key={inn.id}
                innings={inn}
                match={match}
                battingPlayers={battingPlayers}
                bowlingPlayers={bowlingPlayers}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
