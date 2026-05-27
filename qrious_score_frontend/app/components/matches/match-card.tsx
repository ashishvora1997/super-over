"use client";

import {
  Trophy,
  MapPin,
  CalendarDays,
  Swords,
  Zap,
  Edit2,
  Trash2,
} from "lucide-react";
import { Match, MatchStatus } from "@/app/types/match.types";
import { getTeamAvatarText } from "@/app/utils/cricket.utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/auth.store";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { EditMatchModal } from "./edit-match-modal";
import { deleteMatch } from "@/app/services/matches.service";
import toast from "react-hot-toast";

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

export function MatchCard({
  match,
  onUpdate,
}: {
  match: Match;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status: MatchStatus = match.status ?? "scheduled";
  const cfg = STATUS_CONFIG[status];
  const { date, time } = formatMatchDate(match.match_date);

  const teamAName = match.teamA?.name ?? "Team A";
  const teamBName = match.teamB?.name ?? "Team B";
  const teamAInitials = getTeamAvatarText(teamAName);
  const teamBInitials = getTeamAvatarText(teamBName);

  const teamAWon = match.winner_team_id === match.team_a_id;
  const teamBWon = match.winner_team_id === match.team_b_id;
  const isTied = match.result === "tie";
  const isDraw = match.result === "draw";
  const isSuperOver = match.result === "super_over" || match.is_super_over;
  const isNoResult = match.result === "no_result";

  const isCreator = user && match.created_by === user.id;
  const canEditOrDelete = isCreator && status === "scheduled";

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMatch(match.id);
      toast.success("Match deleted successfully");
      setDeleteOpen(false);
      onUpdate?.();
    } catch (err) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete match";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => router.push(`/matches/${match.id}`)}
        className={`cursor-pointer bg-white border rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md relative group ${cfg.cardBorder} ${
          status === "live" ? "shadow-accent/10" : ""
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted min-w-0 flex-1">
            <Trophy size={11} className="flex-shrink-0 text-muted/70" />
            <span className="truncate font-medium">
              {match.tournament?.name ?? "Individual Match"}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-sm ${
                  teamAWon && status === "completed"
                    ? "bg-gradient-to-br from-accent to-accent-dark text-white"
                    : isTied || isNoResult || isDraw
                      ? "bg-gray-100 text-gray-500"
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
                      : isTied || isNoResult || isDraw
                        ? "text-gray-500"
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
                {isSuperOver && status === "live" && (
                  <p className="text-[10px] font-semibold text-purple-600 leading-tight">
                    Super Over{" "}
                    {match.super_over_number > 1
                      ? `${match.super_over_number}`
                      : ""}{" "}
                    🎯
                  </p>
                )}
              </div>
            </div>

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

            <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
              <div className="min-w-0 text-right">
                <p
                  className={`text-xs font-bold leading-tight truncate ${
                    teamBWon && status === "completed"
                      ? "text-accent-dark"
                      : isTied || isNoResult || isDraw
                        ? "text-gray-500"
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
                    : isTied || isNoResult || isDraw
                      ? "bg-gray-100 text-gray-500"
                      : "bg-gray-100 text-foreground"
                }`}
              >
                {teamBInitials}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-x-3 gap-y-1 px-4 pb-3.5 flex-wrap border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
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
            {match.overs_per_side && (
              <div className="flex items-center gap-1 text-[11px] text-muted">
                <Zap size={11} className="flex-shrink-0" />
                <span>{match.overs_per_side} Overs</span>
              </div>
            )}
          </div>

          {canEditOrDelete && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
                className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {canEditOrDelete && (
        <>
          <EditMatchModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            match={match}
            onSuccess={() => onUpdate?.()}
          />
          <ConfirmModal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={handleDelete}
            title="Delete Match"
            description="Are you sure you want to delete this match? This action cannot be undone."
            confirmText="Delete Match"
            loading={isDeleting}
          />
        </>
      )}
    </>
  );
}
