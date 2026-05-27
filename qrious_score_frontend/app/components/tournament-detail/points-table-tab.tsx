"use client";

import { useEffect } from "react";
import { BarChart3, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { Tournament } from "@/app/types/tournaments.types";
import { usePointsTableStore } from "@/app/store/points-table.store";

interface PointsTableTabProps {
  tournament: Tournament;
}

function getPositionColor(position: number) {
  switch (position) {
    case 1:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case 2:
      return "bg-gray-100 text-gray-700 border-gray-200";
    case 3:
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getNrrColor(nrr: number | null) {
  if (nrr === null) return "text-gray-600";
  if (nrr > 0) return "text-emerald-600";
  if (nrr < 0) return "text-red-600";
  return "text-gray-600";
}

export function PointsTableTab({ tournament }: PointsTableTabProps) {
  const { standings, loading, fetchStandings, clearStandings } =
    usePointsTableStore();

  useEffect(() => {
    fetchStandings(tournament.id);

    return () => {
      clearStandings();
    };
  }, [tournament.id, fetchStandings, clearStandings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Points Table
          </h3>
          <p className="text-sm text-muted">
            Tournament standings and statistics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Trophy size={18} className="text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">
            Season {new Date(tournament.start_date).getFullYear()}
          </span>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-border text-xs font-semibold text-muted uppercase tracking-wider">
          <div className="col-span-1">Pos</div>
          <div className="col-span-4">Team</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">Pts</div>
          <div className="col-span-3 text-right">NRR</div>
        </div>

        {standings.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No standings available yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {standings.map((entry, index) => {
              const position = index + 1;
              const nrrValue = entry.net_run_rate ?? 0;
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-1">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold ${getPositionColor(
                        position,
                      )}`}
                    >
                      {position}
                    </span>
                  </div>

                  <div className="col-span-4 flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {entry.team.name}
                    </p>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm text-muted">
                      {entry.matches_played}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-emerald-600">
                      {entry.wins}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-red-600">
                      {entry.losses}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold text-primary">
                      {entry.points}
                    </span>
                  </div>

                  <div className="col-span-3 text-right">
                    <span
                      className={`text-sm font-medium ${getNrrColor(nrrValue)}`}
                    >
                      {nrrValue > 0 ? "+" : ""}
                      {nrrValue.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
          <span>1st Place</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
          <span>2nd Place</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />
          <span>3rd Place</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <TrendingUp size={14} />
          <span>
            P = Played, W = Won, L = Lost, Pts = Points, NRR = Net Run Rate
          </span>
        </div>
      </div>
    </div>
  );
}
