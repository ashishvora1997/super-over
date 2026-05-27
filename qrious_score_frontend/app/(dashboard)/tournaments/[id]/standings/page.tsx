"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  Medal,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { usePointsTableStore } from "@/app/store/points-table.store";
import { getTournament } from "@/app/services/tournament.service";
import { Tournament } from "@/app/types/tournaments.types";
import { PointsTableEntry } from "@/app/types/points-table.types";

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200/50",
  2: "bg-gradient-to-r from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200/50",
  3: "bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-md shadow-orange-200/50",
};

function getRankBadge(rank: number) {
  const style =
    RANK_STYLES[rank] ?? "bg-gray-100 text-gray-600 border border-gray-200";

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold ${style}`}
    >
      {rank}
    </span>
  );
}

function getTournamentGradient(id: number) {
  const gradients = [
    "from-indigo-600 to-indigo-800",
    "from-purple-600 to-purple-800",
    "from-teal-600 to-teal-800",
    "from-orange-500 to-orange-700",
    "from-pink-600 to-pink-800",
    "from-sky-600 to-sky-800",
  ];
  return gradients[id % gradients.length];
}

function StandingCard({
  entry,
  rank,
}: {
  entry: PointsTableEntry;
  rank: number;
}) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`bg-white border rounded-2xl p-4 transition-all ${
        isTop3
          ? "border-primary/20 shadow-md shadow-primary/5"
          : "border-border shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        {getRankBadge(rank)}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">
            {entry.team?.name ?? "Unknown Team"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {entry.team?.short_name ?? "—"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-extrabold text-primary leading-none">
            {entry.points}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-widest mt-0.5">
            pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-border/60">
        {[
          { label: "M", value: entry.matches_played },
          { label: "W", value: entry.wins, color: "text-green-600" },
          { label: "L", value: entry.losses, color: "text-red-500" },
          { label: "T", value: entry.ties, color: "text-amber-600" },
          { label: "NRR", value: entry.net_run_rate?.toFixed(3) ?? "—" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[10px] text-muted uppercase tracking-wider">
              {stat.label}
            </p>
            <p
              className={`text-sm font-bold mt-0.5 ${stat.color ?? "text-foreground"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = Number(params.id);

  const { standings, loading, error, fetchStandings } = usePointsTableStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    setTournamentLoading(true);
    getTournament(tournamentId)
      .then((res) => setTournament(res.data))
      .catch(() => setTournament(null))
      .finally(() => setTournamentLoading(false));

    fetchStandings(tournamentId);
  }, [tournamentId, fetchStandings]);

  const isLoading = loading || tournamentLoading;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-12 flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted">Loading standings…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <button
          onClick={() => router.push("/my-cricket?tab=tournaments")}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Tournaments
        </button>
        <div className="bg-white border border-red-200 rounded-2xl p-12 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <p className="font-semibold text-foreground">
            Failed to load standings
          </p>
          <p className="text-sm text-muted text-center max-w-sm">{error}</p>
          <button
            onClick={() => fetchStandings(tournamentId)}
            className="mt-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const gradient = getTournamentGradient(tournamentId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push("/my-cricket?tab=tournaments")}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Tournaments
        </button>

        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          >
            <Trophy size={22} className="text-white" strokeWidth={1.75} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {tournament?.name ?? "Tournament"} — Standings
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {tournament?.city && (
                <span className="text-sm text-muted">📍 {tournament.city}</span>
              )}
              <span className="text-sm text-muted">
                {standings.length} team{standings.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {standings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Matches",
              value: Math.max(...standings.map((s) => s.matches_played), 0)
                ? standings.reduce((acc, s) => acc + s.matches_played, 0) / 2
                : 0,
              icon: Trophy,
              color: "text-primary bg-primary/10",
            },
            {
              label: "Leader",
              value: standings[0]?.team?.short_name ?? "—",
              icon: Medal,
              color: "text-amber-600 bg-amber-50",
            },
            {
              label: "Top Points",
              value: standings[0]?.points ?? 0,
              icon: TrendingUp,
              color: "text-green-600 bg-green-50",
            },
            {
              label: "Teams",
              value: standings.length,
              icon: Trophy,
              color: "text-indigo-600 bg-indigo-50",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted">{card.label}</p>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {standings.length === 0 && (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy size={26} className="text-primary" />
          </div>
          <p className="font-semibold text-foreground">
            No standings available
          </p>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            Standings will appear here once teams are assigned to this
            tournament and matches are completed.
          </p>
        </div>
      )}

      {standings.length > 0 && (
        <div className="sm:hidden space-y-3">
          {standings.map((entry, i) => (
            <StandingCard key={entry.id} entry={entry} rank={i + 1} />
          ))}
        </div>
      )}

      {standings.length > 0 && (
        <div className="hidden sm:block bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Team
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    M
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    W
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    L
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    T
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    NR
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="text-center py-3.5 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    NRR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {standings.map((entry, i) => {
                  const rank = i + 1;
                  const isTop = rank <= 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isTop
                          ? "bg-primary/[0.02] hover:bg-primary/[0.05]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3.5 px-4">{getRankBadge(rank)}</td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {entry.team?.name ?? "Unknown Team"}
                          </p>
                          <p className="text-xs text-muted">
                            {entry.team?.short_name ?? "—"}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3.5 px-3 font-medium text-foreground">
                        {entry.matches_played}
                      </td>
                      <td className="text-center py-3.5 px-3 font-bold text-green-600">
                        {entry.wins}
                      </td>
                      <td className="text-center py-3.5 px-3 font-medium text-red-500">
                        {entry.losses}
                      </td>
                      <td className="text-center py-3.5 px-3 font-medium text-amber-600">
                        {entry.ties}
                      </td>
                      <td className="text-center py-3.5 px-3 font-medium text-muted">
                        {entry.no_results}
                      </td>
                      <td className="text-center py-3.5 px-3">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {entry.points}
                        </span>
                      </td>
                      <td className="text-center py-3.5 px-4 font-mono text-sm text-muted">
                        {entry.net_run_rate !== null
                          ? entry.net_run_rate >= 0
                            ? `+${entry.net_run_rate.toFixed(3)}`
                            : entry.net_run_rate.toFixed(3)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
