"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  CalendarDays,
  Swords,
  Trophy,
  Zap,
  Eye,
  Target,
  AlertCircle,
  Settings2,
  Users,
  LayoutList,
  TableProperties,
} from "lucide-react";
import { useAuthStore } from "@/app/store/auth.store";
import { useTossStore } from "@/app/store/toss.store";
import { useInningsStore } from "@/app/store/innings.store";
import { useMatchStore } from "@/app/store/matches.store";
import { TossSection } from "@/app/components/toss/toss-section";
import { InningsCard } from "@/app/components/innings/innings-card";
import { Match } from "@/app/types/match.types";
import { getMatchById, getMatchScorers } from "@/app/services/matches.service";
import { MatchRulesModal } from "@/app/components/matches/match-rules-modal";
import { MatchScorersModal } from "@/app/components/matches/match-scorers-modal";
import { ViewerScoreboardContainer } from "@/app/components/matches/scorecard-view";
import { getTeamAvatarText } from "@/app/utils/cricket.utils";

type Tab = "summary" | "scorecard";

function MatchDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-28 w-full bg-gray-200 rounded-2xl animate-pulse" />
      <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
      <div className="h-20 w-full bg-gray-200 rounded-2xl animate-pulse" />
      <div className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse" />
    </div>
  );
}

function TeamBadge({
  name,
  isWinner,
  isCompleted,
  result,
  align = "left",
}: {
  name: string;
  isWinner: boolean;
  isCompleted: boolean;
  result: string | null;
  align?: "left" | "right";
}) {
  const tied = isCompleted && (result === "tie" || result === "no_result");
  const badgeCls = isWinner
    ? "bg-gradient-to-br from-accent to-accent-dark text-white"
    : tied
      ? "bg-gray-100 text-gray-500"
      : "bg-gray-100 text-foreground";

  if (align === "right") {
    return (
      <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
        <div className="text-right min-w-0">
          <p
            className={`text-sm font-bold truncate ${
              isWinner
                ? "text-accent-dark"
                : tied
                  ? "text-gray-500"
                  : "text-foreground"
            }`}
          >
            {name}
          </p>
          {isWinner && (
            <p className="text-[10px] font-semibold text-accent-dark/70">
              Winner 🏆
            </p>
          )}
          {isCompleted && result === "tie" && (
            <p className="text-[10px] font-semibold text-amber-600">Tied</p>
          )}
          {isCompleted && result === "draw" && (
            <p className="text-[10px] font-semibold text-blue-600">Draw</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeCls}`}
        >
          {getTeamAvatarText(name)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-2 min-w-0">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeCls}`}
      >
        {getTeamAvatarText(name)}
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-bold truncate ${
            isWinner
              ? "text-accent-dark"
              : tied
                ? "text-gray-500"
                : "text-foreground"
          }`}
        >
          {name}
        </p>
        {isWinner && (
          <p className="text-[10px] font-semibold text-accent-dark/70">
            Winner 🏆
          </p>
        )}
        {isCompleted && result === "tie" && (
          <p className="text-[10px] font-semibold text-amber-600">Tied</p>
        )}
        {isCompleted && result === "draw" && (
          <p className="text-[10px] font-semibold text-blue-600">Draw</p>
        )}
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.matchId);

  const [matchDetail, setMatchDetail] = useState<Match | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scorersOpen, setScorersOpen] = useState(false);
  const [scorers, setScorers] = useState<
    { id: number; name: string; email: string; isBusy?: boolean }[]
  >([]);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

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

  const match = matches.find((m) => m.id === matchId);

  useEffect(() => {
    if (!matches.length) fetchMatches();
    fetchToss(matchId);
    fetchInnings(matchId);
    getMatchById(matchId).then((res) => setMatchDetail(res.data));
    getMatchScorers(matchId)
      .then((res) => setScorers(res.data ?? []))
      .catch(() => {});
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
  const isCompleted = match.status === "completed";

  const isScorer =
    scorers.some((s) => s.id === user?.id) ||
    user?.id === match.created_by ||
    user?.id === match.active_scorer_id;
  const isLive = innings.some((i) => i.status === "in_progress");
  const hasInnings = innings.length > 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <a
          href="/my-cricket?tab=matches"
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Trophy size={12} className="text-muted" />
              <span className="text-xs font-medium text-muted">
                {match.tournament.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isCompleted && match.result === "tie" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle size={10} /> Match Tied
                </span>
              )}
              {isCompleted && match.result === "no_result" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  <AlertCircle size={10} /> No Result
                </span>
              )}
              {isCompleted && match.result === "draw" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <AlertCircle size={10} /> Match Drawn
                </span>
              )}
              {match.is_super_over && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  <Target size={10} /> Super Over
                  {match.super_over_number > 1
                    ? ` ${match.super_over_number}`
                    : ""}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <TeamBadge
            name={match.teamA?.name ?? ""}
            isWinner={match.winner_team_id === match.team_a_id}
            isCompleted={isCompleted}
            result={match.result}
          />
          <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Swords size={14} className="text-muted" strokeWidth={1.75} />
          </div>
          <TeamBadge
            name={match.teamB?.name ?? ""}
            isWinner={match.winner_team_id === match.team_b_id}
            isCompleted={isCompleted}
            result={match.result}
            align="right"
          />
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

      <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "summary"
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <LayoutList size={13} />
          Summary
        </button>
        <button
          onClick={() => setActiveTab("scorecard")}
          disabled={!hasInnings}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === "scorecard"
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <TableProperties size={13} />
          Scorecard
        </button>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-3">
          <button
            onClick={() => setRulesOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings2 size={15} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  Match Rules
                </p>
                <p className="text-[11px] text-muted">
                  {match.tournament_id
                    ? "Inherited from tournament"
                    : "Custom rules"}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted">View →</span>
          </button>

          <MatchRulesModal
            open={rulesOpen}
            onClose={() => setRulesOpen(false)}
            matchId={matchId}
            isOwner={user?.id !== undefined && match.created_by === user.id}
          />

          {!match.tournament_id ? (
            <>
              <button
                onClick={() => setScorersOpen(true)}
                className="w-full flex items-center justify-between p-3.5 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users size={15} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      Manage Scorers
                    </p>
                    <p className="text-[11px] text-muted">
                      Assign up to 3 scorers for this match
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted">Manage →</span>
              </button>

              <MatchScorersModal
                open={scorersOpen}
                onClose={() => {
                  setScorersOpen(false);
                  getMatchScorers(matchId)
                    .then((res) => setScorers(res.data ?? []))
                    .catch(() => {});
                }}
                matchId={matchId}
                matchCreatorId={match.created_by}
              />
            </>
          ) : scorers.length > 0 ? (
            <div className="bg-white border border-border rounded-xl p-3.5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Tournament Scorers
                  </p>
                  <p className="text-[11px] text-muted">
                    Inherited from tournament
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {scorers.map((scorer) => (
                  <div
                    key={scorer.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {scorer.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {scorer.name}
                        </p>
                        <p className="text-[10px] text-muted">{scorer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {match.active_scorer_id === scorer.id && (
                        <span className="text-[10px] font-bold bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full border border-accent/20">
                          Active
                        </span>
                      )}
                      {scorer.isBusy &&
                        match.active_scorer_id !== scorer.id && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            Busy
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <TossSection match={match} />

          {hasInnings && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Innings</h3>
                <div className="flex items-center gap-2">
                  {isScorer && isLive && (
                    <button
                      onClick={() => router.push(`/matches/${matchId}/scoring`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 hover:shadow-lg bg-gradient-to-r from-accent to-accent-dark shadow-accent/25"
                    >
                      <Zap size={12} /> Score
                    </button>
                  )}
                </div>
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
      )}

      <div className={activeTab === "scorecard" ? "" : "hidden"}>
        <ViewerScoreboardContainer
          allInnings={innings}
          matchDetail={matchDetail}
          showHeader={true}
        />
      </div>
    </div>
  );
}
