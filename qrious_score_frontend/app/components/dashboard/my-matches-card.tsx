"use client";

import Link from "next/link";
import {
  ExternalLink,
  Radio,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { MyMatch } from "@/app/services/dashboard.service";

interface MyMatchesCardProps {
  matches: MyMatch[];
  userTeamIds: number[];
  loading?: boolean;
}

function statusBadge(match: MyMatch, userTeamIds: number[]) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
        <Radio size={10} className="animate-pulse" />
        Live
      </span>
    );
  }
  if (match.status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        <Calendar size={10} />
        Upcoming
      </span>
    );
  }

  const userWon =
    match.winner_team_id !== null && userTeamIds.includes(match.winner_team_id);
  const isTie = match.result === "tie";

  if (isTie) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        Tied
      </span>
    );
  }
  if (match.winner_team_id === null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-muted border border-border">
        NR
      </span>
    );
  }
  return userWon ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
      <CheckCircle size={10} />
      Won
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
      <XCircle size={10} />
      Lost
    </span>
  );
}

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function MatchRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-3.5 w-28 bg-gray-100 rounded-md" />
        <div className="h-3 w-36 bg-gray-50 rounded-md" />
      </div>
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
    </div>
  );
}

export function MyMatchesCard({
  matches,
  userTeamIds,
  loading = false,
}: MyMatchesCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">My matches</h3>
        </div>
        <Link
          href="/my-cricket?tab=matches"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          View all <ExternalLink size={11} />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <MatchRowSkeleton key={i} />)
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">
            No matches yet. Join a team to get started!
          </p>
        ) : (
          matches.map((match) => {
            const isTeamA = userTeamIds.includes(match.team_a_id);
            const myTeamName = isTeamA ? match.teamA?.name : match.teamB?.name;
            const oppName = isTeamA ? match.teamB?.name : match.teamA?.name;
            const matchTitle = `${myTeamName} vs ${oppName}`;
            const dateLabel = formatMatchDate(match.match_date);
            const venue = match.venue;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex items-center justify-between py-2.5 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {matchTitle}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {dateLabel}
                    {venue ? ` · ${venue}` : ""}
                  </p>
                </div>
                <div className="ml-3 shrink-0">
                  {statusBadge(match, userTeamIds)}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
