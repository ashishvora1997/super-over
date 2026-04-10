"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Trophy,
  MapPin,
  CalendarDays,
  Swords,
  Filter,
} from "lucide-react";

import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { MatchFormModal } from "@/app/components/matches/match-form-modal";

import { useMatchStore } from "@/app/store/matches.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import { Match, MatchStatus } from "@/app/types/match.types";
import { RoleGuard } from "@/app/components/auth/role-guard";

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; cardBorder: string; badgeCls: string; dot: string }
> = {
  scheduled: {
    label: "Scheduled",
    cardBorder: "border-border",
    badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  live: {
    label: "Live",
    cardBorder: "border-accent/40 ring-1 ring-accent/20",
    badgeCls: "bg-accent/10 text-accent-dark border-accent/30",
    dot: "bg-accent animate-pulse",
  },
  completed: {
    label: "Completed",
    cardBorder: "border-border",
    badgeCls: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

function StatusBadge({ status }: { status: MatchStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badgeCls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatMatchDate(iso: string) {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MatchSkeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

// ─── Match Card ──────────────────────────────────────────────────────────────

function MatchCard({
  match,
  onEdit,
  onDelete,
}: {
  match: Match;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status: MatchStatus = match.status ?? "scheduled";
  const cfg = STATUS_CONFIG[status];
  const { date, time } = formatMatchDate(match.match_date);

  const teamAName = match.teamA?.name ?? "Team A";
  const teamBName = match.teamB?.name ?? "Team B";

  const teamAInitials = teamAName.slice(0, 3).toUpperCase();
  const teamBInitials = teamBName.slice(0, 3).toUpperCase();

  const teamAWon = match.winner_team_id === match.team_a_id;
  const teamBWon = match.winner_team_id === match.team_b_id;

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${cfg.cardBorder} ${
        status === "live" ? "shadow-accent/10" : ""
      }`}
    >
      {/* ── Top bar: tournament + status + actions ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted min-w-0 flex-1">
          <Trophy size={11} className="flex-shrink-0 text-muted/70" />
          <span className="truncate font-medium">
            {match.tournament?.name ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusBadge status={status} />
          <RoleGuard allowedRoles={["admin", "scorer"]}>
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
            >
              <Pencil size={13} />
            </button>
          </RoleGuard>
          <RoleGuard allowedRoles={["admin"]}>
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* ── VS Row ── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Team A */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${
                teamAWon && status === "completed"
                  ? "bg-gradient-to-br from-accent to-accent-dark text-white"
                  : "bg-gray-100 text-foreground"
              }`}
            >
              {teamAInitials}
            </div>
            <div className="min-w-0">
              <p
                className={`text-xs font-bold leading-tight truncate ${
                  teamAWon && status === "completed"
                    ? "text-accent-dark"
                    : "text-foreground"
                }`}
              >
                {teamAName}
              </p>
              {teamAWon && status === "completed" && (
                <p className="text-[10px] font-semibold text-accent-dark/70 leading-tight">
                  Winner 🏆
                </p>
              )}
            </div>
          </div>

          {/* VS divider */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                status === "live" ? "bg-accent/10" : "bg-gray-50"
              }`}
            >
              <Swords
                size={14}
                className={status === "live" ? "text-accent" : "text-muted"}
                strokeWidth={1.75}
              />
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <div className="min-w-0 text-right">
              <p
                className={`text-xs font-bold leading-tight truncate ${
                  teamBWon && status === "completed"
                    ? "text-accent-dark"
                    : "text-foreground"
                }`}
              >
                {teamBName}
              </p>
              {teamBWon && status === "completed" && (
                <p className="text-[10px] font-semibold text-accent-dark/70 leading-tight">
                  Winner 🏆
                </p>
              )}
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${
                teamBWon && status === "completed"
                  ? "bg-gradient-to-br from-accent to-accent-dark text-white"
                  : "bg-gray-100 text-foreground"
              }`}
            >
              {teamBInitials}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: date + venue ── */}
      <div className="flex items-center gap-x-3 gap-y-1 px-4 pb-3.5 flex-wrap border-t border-border/50 pt-2.5">
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <CalendarDays size={11} className="flex-shrink-0" />
          <span>{date}</span>
          {time && <span className="text-muted/60 ml-0.5">· {time}</span>}
        </div>
        {match.venue && (
          <div className="flex items-center gap-1 text-[11px] text-muted min-w-0">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const {
    matches,
    loading,
    fetchMatches,
    deleteMatch,
    tournamentFilter,
    setTournamentFilter,
  } = useMatchStore();
  const { tournaments, fetchTournaments } = useTournamentStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Match | null>(null);

  useEffect(() => {
    setTournamentFilter(undefined);
    fetchMatches();
    fetchTournaments("", 1);
  }, []);

  const handleCreate = () => {
    setMode("create");
    setSelectedMatch(null);
    setOpen(true);
  };
  const handleEdit = (m: Match) => {
    setMode("edit");
    setSelectedMatch(m);
    setOpen(true);
  };
  const handleDeleteClick = (m: Match) => {
    setToDelete(m);
    setDeleteOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    await deleteMatch(toDelete.id);
    setDeleteOpen(false);
  };

  const grouped = {
    live: matches.filter((m) => m.status === "live"),
    scheduled: matches.filter((m) => m.status === "scheduled"),
    completed: matches.filter((m) => m.status === "completed"),
  };

  const orderedMatches = [
    ...grouped.live,
    ...grouped.scheduled,
    ...grouped.completed,
  ];

  const liveCount = grouped.live.length;
  const scheduledCount = grouped.scheduled.length;
  const completedCount = grouped.completed.length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Matches
          </h2>
          <p className="text-xs text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {matches.length > 0
                ? `${matches.length} match${matches.length !== 1 ? "es" : ""}`
                : "Schedule and manage matches"}
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 text-accent font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {liveCount} live
              </span>
            )}
          </p>
        </div>
        <RoleGuard allowedRoles={["admin", "scorer"]}>
          <button
            onClick={handleCreate}
            className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Schedule Match</span>
            <span className="sm:hidden">Add</span>
          </button>
        </RoleGuard>
      </div>

      {matches.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Live",
              count: liveCount,
              cls: "text-accent-dark bg-accent/10 border-accent/20",
            },
            {
              label: "Scheduled",
              count: scheduledCount,
              cls: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
              label: "Completed",
              count: completedCount,
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

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
          <Filter size={12} />
          <span className="font-medium">Filter:</span>
        </div>
        <button
          onClick={() => {
            setTournamentFilter(undefined);
            fetchMatches(undefined);
          }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            tournamentFilter === undefined
              ? "bg-primary text-white border-primary"
              : "bg-white text-muted border-border hover:border-primary/40"
          }`}
        >
          All
        </button>
        {tournaments.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTournamentFilter(t.id);
              fetchMatches(t.id);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              tournamentFilter === t.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted border-border hover:border-primary/40"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* ── Match cards ── */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <MatchSkeleton key={i} />
          ))}
        </div>
      ) : orderedMatches.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Swords size={22} className="text-primary" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-foreground text-sm">
            No matches yet
          </p>
          <p className="text-xs text-muted mt-1">
            Schedule your first match to get started
          </p>
          <RoleGuard allowedRoles={["admin", "scorer"]}>
            <button
              onClick={handleCreate}
              className="mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl"
            >
              Schedule Match
            </button>
          </RoleGuard>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {orderedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onEdit={() => handleEdit(match)}
              onDelete={() => handleDeleteClick(match)}
            />
          ))}
        </div>
      )}

      <MatchFormModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        match={selectedMatch}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Match"
        description={`Delete the match between "${toDelete?.teamA?.name}" and "${toDelete?.teamB?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
