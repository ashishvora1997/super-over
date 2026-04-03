"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  MapPin,
  CalendarDays,
  Users,
} from "lucide-react";

import { Table } from "@/app/components/ui/Table";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { TournamentFormModal } from "@/app/components/tournaments/tournament-form-modal";
import { AssignTeamsModal } from "@/app/components/tournaments/assign-teams-modal";

import { useTournamentStore } from "@/app/store/tournament.store";
import { useDebounce } from "@/app/hooks/useDebounce";
import { TournamentStatus } from "@/app/types/tournaments.types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TournamentStatus,
  { label: string; className: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  ongoing: {
    label: "Ongoing",
    className: "bg-accent/10 text-accent-dark border-accent/20",
    dot: "bg-accent animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

function StatusBadge({ status }: { status: TournamentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTournamentColor(id: number) {
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

function TournamentAvatar({
  id,
  size = "md",
}: {
  id: number;
  size?: "sm" | "md" | "lg";
}) {
  const gradient = getTournamentColor(id);
  const sizeClass =
    size === "lg"
      ? "w-14 h-14 text-xl"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}
    >
      <Trophy
        size={size === "lg" ? 22 : size === "sm" ? 14 : 18}
        className="text-white"
        strokeWidth={1.75}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TournamentsPage() {
  const {
    tournaments,
    total,
    page,
    pageSize,
    fetchTournaments,
    deleteTournament,
    loading,
  } = useTournamentStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [toAssign, setToAssign] = useState<any>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    fetchTournaments("", 1);
  }, []);

  useEffect(() => {
    fetchTournaments(debouncedSearch, 1);
  }, [debouncedSearch]);

  const handleCreate = () => {
    setMode("create");
    setSelectedTournament(null);
    setOpen(true);
  };
  const handleEdit = (t: any) => {
    setMode("edit");
    setSelectedTournament(t);
    setOpen(true);
  };
  const handleDeleteClick = (t: any) => {
    setToDelete(t);
    setDeleteOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    await deleteTournament(toDelete.id);
    setDeleteOpen(false);
  };
  const handleManageTeams = (t: any) => {
    setToAssign(t);
    setAssignOpen(true);
  };

  // ── Desktop columns ──────────────────────────────────────────────────────
  const columns = [
    {
      key: "name",
      title: "Tournament",
      render: (t: any) => (
        <div className="flex items-center gap-3">
          <TournamentAvatar id={t.id} size="sm" />
          <div>
            <p className="font-semibold text-foreground">{t.name}</p>
            {t.location && (
              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {t.location}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      title: "Dates",
      render: (t: any) => (
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays size={13} className="flex-shrink-0" />
          <span>
            {formatDate(t.start_date)} – {formatDate(t.end_date)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (t: any) => <StatusBadge status={t.status} />,
    },
    {
      key: "teams",
      title: "Teams",
      render: (t: any) => {
        const count = t.teams?.length || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              count > 0
                ? "bg-accent/10 text-accent-dark border-accent/20"
                : "bg-gray-100 text-muted border-border"
            }`}
          >
            <Users size={11} />
            {count} {count === 1 ? "team" : "teams"}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (t: any) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => handleManageTeams(t)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Users size={12} />
            Teams
          </button>
          <button
            onClick={() => handleEdit(t)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(t)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Tournaments
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {total > 0
              ? `${total} tournament${total !== 1 ? "s" : ""} registered`
              : "Manage your cricket tournaments"}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Tournament</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tournaments..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm placeholder:text-muted/60"
        />
      </div>

      {/* ── MOBILE VIEW ── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-2xl p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-5 bg-gray-100 rounded w-1/4 mt-1" />
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl mt-3" />
            </div>
          ))
        ) : tournaments.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-10 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trophy size={26} className="text-primary" />
            </div>
            <p className="font-semibold text-foreground">No tournaments yet</p>
            <p className="text-sm text-muted mt-1">
              Create your first tournament to get started
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl"
            >
              Add Tournament
            </button>
          </div>
        ) : (
          tournaments.map((tournament: any) => {
            const gradient = getTournamentColor(tournament.id);
            const teamCount = tournament.teams?.length || 0;
            const status: TournamentStatus = tournament.status ?? "upcoming";
            const cfg = STATUS_CONFIG[status];

            return (
              <div
                key={tournament.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Accent stripe */}
                <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <TournamentAvatar id={tournament.id} size="lg" />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base leading-tight truncate">
                        {tournament.name}
                      </h3>

                      {tournament.location && (
                        <div className="flex items-center gap-1 text-muted text-sm mt-0.5">
                          <MapPin size={12} />
                          <span className="truncate">
                            {tournament.location}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={status} />

                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            teamCount > 0
                              ? "bg-accent/10 text-accent-dark border-accent/20"
                              : "bg-gray-100 text-muted border-border"
                          }`}
                        >
                          <Users size={10} />
                          {teamCount} {teamCount === 1 ? "team" : "teams"}
                        </span>
                      </div>
                    </div>

                    {/* Icon actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(tournament)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-primary/10 text-muted hover:text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tournament)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Date range row */}
                  <div className="flex items-center gap-1.5 text-xs text-muted mt-3 px-0.5">
                    <CalendarDays size={12} />
                    <span>
                      {formatDate(tournament.start_date)} –{" "}
                      {formatDate(tournament.end_date)}
                    </span>
                  </div>

                  {/* Manage Teams CTA */}
                  <button
                    onClick={() => handleManageTeams(tournament)}
                    className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${gradient} shadow-sm active:scale-[0.98] transition-transform`}
                  >
                    <Users size={14} />
                    Manage Teams
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile pagination */}
        {!loading && tournaments.length > 0 && total > pageSize && (
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-xs text-muted">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
              {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTournaments(debouncedSearch, page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 bg-white"
              >
                Prev
              </button>
              <button
                onClick={() => fetchTournaments(debouncedSearch, page + 1)}
                disabled={page * pageSize >= total}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className="hidden sm:block">
        <Table
          data={tournaments}
          columns={columns}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={(newPage) => fetchTournaments(debouncedSearch, newPage)}
          emptyMessage="No tournaments found"
        />
      </div>

      {/* Modals */}
      <TournamentFormModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        tournament={selectedTournament}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${toDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      <AssignTeamsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        tournament={toAssign}
      />
    </div>
  );
}
