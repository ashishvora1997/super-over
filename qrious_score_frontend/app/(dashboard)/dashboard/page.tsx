"use client";

import { useEffect, useMemo } from "react";
import { Flame, Target, TrendingUp, Swords, Calendar } from "lucide-react";
import { useAuthStore } from "@/app/store/auth.store";
import { useDashboardStore } from "@/app/store/dashboard.store";
import { StatCard } from "@/app/components/dashboard/stat-card";
import { MyMatchesCard } from "@/app/components/dashboard/my-matches-card";
import { MyTeamsCard } from "@/app/components/dashboard/my-teams-card";
import { RecentFormCard } from "@/app/components/dashboard/recent-form-card";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const userTeamIds = useMemo(() => {
    if (!stats?.myTeams) return [];
    return stats.myTeams.map((t) => t.id);
  }, [stats]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted mt-0.5">{formatDate()}</p>
      </div>

      {error && (
        <div className="bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Career Statistics
          </p>
          <div
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-white border border-border px-2.5 py-1.5 rounded-lg shadow-sm"
            title="Filtering by season coming soon"
          >
            <Calendar size={13} className="text-muted" />
            All-Time
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Runs"
            icon={Flame}
            value={String(stats?.runsThisSeason ?? 0)}
            subtitle="Runs scored"
            trendUp={true}
            loading={loading}
            accentColor="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatCard
            title="Average"
            icon={TrendingUp}
            value={String(stats?.battingAverage ?? 0)}
            subtitle="Batting average"
            trendUp={true}
            loading={loading}
            accentColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatCard
            title="Wickets"
            icon={Target}
            value={String(stats?.wicketsTaken ?? 0)}
            subtitle="Wickets taken"
            trendUp={null}
            loading={loading}
            accentColor="bg-violet-50"
            iconColor="text-violet-500"
          />
          <StatCard
            title="Strike Rate"
            icon={Swords}
            value={String(stats?.strikeRate ?? 0)}
            subtitle="Strike rate"
            trendUp={true}
            loading={loading}
            accentColor="bg-accent/10"
            iconColor="text-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <MyMatchesCard
          matches={stats?.myMatches ?? []}
          userTeamIds={userTeamIds}
          loading={loading}
        />

        <div className="flex flex-col gap-4">
          <MyTeamsCard teams={stats?.myTeams ?? []} loading={loading} />
          <RecentFormCard
            form={stats?.recentForm ?? []}
            highlights={stats?.highlights ?? null}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
