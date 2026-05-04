"use client";

import { MatchRow } from "@/app/components/dashboard/match-row";
import { StatCard } from "@/app/components/dashboard/stat-card";
import { useAuthStore } from "@/app/store/auth.store";
import { useMatchStore } from "@/app/store/matches.store";
import { usePlayerStore } from "@/app/store/players.store";
import { useTeamStore } from "@/app/store/teams.store";
import { Users, UsersRound, Trophy, Radio } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLiveMatchUpdates } from "@/app/hooks/useLiveMatchUpdates";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const players = usePlayerStore((state) => state.playersList);
  const teams = useTeamStore((state) => state.teamsList);
  const matchesList = useMatchStore((state) => state.matchesList);
  const matches = useMatchStore((state) => state.matches);

  const fetchPlayersList = usePlayerStore((state) => state.fetchPlayersList);
  const fetchTeamsList = useTeamStore((state) => state.fetchTeamsList);
  const fetchMatchesList = useMatchStore((state) => state.fetchMatchesList);
  const fetchMatches = useMatchStore((state) => state.fetchMatches);

  useEffect(() => {
    fetchPlayersList();
    fetchTeamsList();
    fetchMatchesList();
    fetchMatches();
  }, [fetchPlayersList, fetchTeamsList, fetchMatchesList, fetchMatches]);

  const liveMatches = matches.filter((item) => item.status === "live").length;

  const recentMatches = useMemo(() => {
    const sorted = [...matches].sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (a.status !== "live" && b.status === "live") return 1;
      return (
        new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      );
    });
    return sorted.slice(0, 5);
  }, [matches]);

  const liveMatchIds = useMemo(
    () => matches.filter((m) => m.status === "live").map((m) => m.id),
    [matches],
  );
  useLiveMatchUpdates(liveMatchIds);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back {user?.name} 👋
        </h2>
        <p className="text-sm text-muted">Here's what's happening today</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <StatCard
          title="Players"
          value={`${players.length}`}
          icon={Users}
          trend="+12 this month"
          variant="blue"
        />
        <StatCard
          title="Teams"
          value={`${teams.length}`}
          icon={UsersRound}
          trend="+2 this month"
          variant="violet"
        />
        <StatCard
          title="Matches"
          value={`${matchesList.length}`}
          icon={Trophy}
          trend="+5 this week"
          variant="amber"
        />
        <StatCard
          title="Live Now"
          value={`${liveMatches}`}
          icon={Radio}
          trend="Active matches"
          variant="green"
          pulse
        />
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Recent Matches
          </h3>
          <span className="text-xs text-muted">{matches.length} total</span>
        </div>

        <div className="divide-y divide-border">
          {recentMatches.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">
              No matches yet. Create your first match to get started.
            </div>
          ) : (
            recentMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
