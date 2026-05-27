"use client";

import { useEffect, useState } from "react";
import { Plus, Trophy, MapPin, CalendarDays, Swords, Zap } from "lucide-react";
import { useAuthStore } from "@/app/store/auth.store";
import { useMatchStore } from "@/app/store/matches.store";
import { Match, MatchStatus } from "@/app/types/match.types";
import { CreateMatchFlow } from "@/app/components/matches/create-match-flow";
import { useRouter } from "next/navigation";

import { MatchCard } from "@/app/components/matches/match-card";

export function MyCricketMatchesTab() {
  const { matches, loading, fetchMatches } = useMatchStore();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const myMatches = matches;

  const grouped = {
    live: myMatches.filter((m) => m.status === "live"),
    scheduled: myMatches.filter((m) => m.status === "scheduled"),
    completed: myMatches.filter((m) => m.status === "completed"),
  };

  const orderedMatches = [
    ...grouped.live,
    ...grouped.scheduled,
    ...grouped.completed,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {myMatches.length > 0
            ? `${myMatches.length} match${myMatches.length !== 1 ? "es" : ""} associated with you`
            : "No matches found"}
          {grouped.live.length > 0 && (
            <span className="inline-flex items-center gap-1 ml-2 text-accent font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {grouped.live.length} live
            </span>
          )}
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Match
        </button>
      </div>

      {myMatches.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Live",
              count: grouped.live.length,
              cls: "text-accent-dark bg-accent/10 border-accent/20",
            },
            {
              label: "Scheduled",
              count: grouped.scheduled.length,
              cls: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
              label: "Completed",
              count: grouped.completed.length,
              cls: "text-gray-600 bg-gray-100 border-gray-200",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border px-3 py-2.5 text-center ${s.cls}`}
            >
              <p className="text-lg font-bold leading-none">{s.count}</p>
              <p className="text-[11px] font-medium mt-1 opacity-80">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {orderedMatches.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Swords size={22} className="text-primary" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-foreground text-sm">
            No matches yet
          </p>
          <p className="text-xs text-muted mt-1">
            Create your first match to get started
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Create Match
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {orderedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onUpdate={() => fetchMatches()}
            />
          ))}
        </div>
      )}

      <CreateMatchFlow
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onMatchCreated={() => fetchMatches()}
      />
    </div>
  );
}
