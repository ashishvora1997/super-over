"use client";

import { ActionButton } from "@/app/components/dashboard/action-button";
import { MatchRow } from "@/app/components/dashboard/match-row";
import { StatCard } from "@/app/components/dashboard/stat-card";
import { useAuthStore } from "@/app/store/auth.store";
import {
  Users,
  UsersRound,
  Trophy,
  Radio,
  UserPlus,
  PlusCircle,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

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
          value="120"
          icon={Users}
          trend="+12 this month"
          variant="blue"
        />
        <StatCard
          title="Teams"
          value="8"
          icon={UsersRound}
          trend="+2 this month"
          variant="violet"
        />
        <StatCard
          title="Matches"
          value="34"
          icon={Trophy}
          trend="+5 this week"
          variant="amber"
        />
        <StatCard
          title="Live Now"
          value="2"
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
        </div>

        <div className="divide-y divide-border">
          <MatchRow
            home="RCB"
            away="MI"
            homeScore="186/4"
            awayScore="172/8"
            overs="20"
            status="completed"
            result="RCB won by 14 runs"
          />
          <MatchRow
            home="CSK"
            away="GT"
            homeScore="124/3"
            awayScore="—"
            overs="14.2"
            status="live"
            result="CSK batting • 14.2 overs"
          />
          <MatchRow
            home="KKR"
            away="PBKS"
            homeScore="—"
            awayScore="—"
            overs="—"
            status="upcoming"
            result="Today • 7:30 PM IST"
          />
        </div>
      </div>
    </div>
  );
}
