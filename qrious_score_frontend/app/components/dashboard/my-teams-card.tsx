"use client";

import Link from "next/link";
import { UsersRound, ArrowRight } from "lucide-react";
import type { MyTeam } from "@/app/services/dashboard.service";
import { getTeamAvatarText } from "@/app/utils/cricket.utils";

interface MyTeamsCardProps {
  teams: MyTeam[];
  loading?: boolean;
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BADGE_COLORS = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-rose-100", text: "text-rose-600" },
];

function badgeColor(id: number) {
  return BADGE_COLORS[id % BADGE_COLORS.length];
}

function TeamRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-24 bg-gray-100 rounded-md" />
        <div className="h-3 w-20 bg-gray-50 rounded-md" />
      </div>
      <div className="space-y-1 text-right">
        <div className="h-3.5 w-12 bg-gray-100 rounded-md" />
        <div className="h-3 w-16 bg-gray-50 rounded-md" />
      </div>
    </div>
  );
}

export function MyTeamsCard({ teams, loading = false }: MyTeamsCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <UsersRound size={14} className="text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">My teams</h3>
        </div>
        <Link
          href="/my-cricket?tab=teams"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          Manage <ArrowRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <TeamRowSkeleton key={i} />)
        ) : teams.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">
            You&apos;re not part of any team yet.
          </p>
        ) : (
          teams.map((team) => {
            const color = badgeColor(team.id);
            return (
              <Link
                key={team.id}
                href={`/my-cricket/teams/${team.id}`}
                className="flex items-center gap-3 py-2.5 group"
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}
                >
                  {getTeamAvatarText(team.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {team.name}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {roleLabel(team.role)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    {team.match_count} matches
                  </p>
                  <p className="text-xs text-muted">career</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
