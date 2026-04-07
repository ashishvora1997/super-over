"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  MapPin,
  Users,
} from "lucide-react";

import { Table } from "@/app/components/ui/Table";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { TeamFormModal } from "@/app/components/teams/team-form-modal";
import { AssignPlayersModal } from "@/app/components/teams/assign-players-modal";

import { useTeamStore } from "@/app/store/teams.store";
import { useDebounce } from "@/app/hooks/useDebounce";
import { Team } from "@/app/types/teams.types";
import { Column } from "@/app/types/table.types";
import { TeamDetailModal } from "@/app/components/teams/team-detail-modal";

// Generates a consistent gradient from a team name
function getTeamColor(name: string) {
  const colors = [
    {
      bg: "from-blue-600 to-blue-800",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      bg: "from-emerald-600 to-emerald-800",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      bg: "from-violet-600 to-violet-800",
      badge: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      bg: "from-rose-600 to-rose-800",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      bg: "from-amber-500 to-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      bg: "from-cyan-600 to-cyan-800",
      badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function TeamAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = getTeamColor(name);
  const initials = name.slice(0, 2).toUpperCase();
  const sizeClass =
    size === "lg"
      ? "w-14 h-14 text-xl"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center font-bold text-white shadow-md flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function TeamsPage() {
  const { teams, total, page, pageSize, fetchTeams, deleteTeam, loading } =
    useTeamStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [assignOpen, setAssignOpen] = useState(false);
  const [teamToAssign, setTeamToAssign] = useState<Team | null>(null);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams("", 1);
  }, []);
  useEffect(() => {
    fetchTeams(debouncedSearch, 1);
  }, [debouncedSearch]);

  const handleCreate = () => {
    setMode("create");
    setSelectedTeam(null);
    setOpen(true);
  };
  const handleEdit = (team: Team) => {
    setMode("edit");
    setSelectedTeam(team);
    setOpen(true);
  };
  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team);
    setDeleteOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    await deleteTeam(teamToDelete.id);
    setDeleteOpen(false);
  };
  const handleViewSquad = (team: Team) => {
    setTeamToAssign(team);
    setAssignOpen(true);
  };

  // Desktop columns
  const columns: Column<Team>[] = [
    {
      key: "name",
      title: "Team",
      render: (t: Team) => (
        <div className="flex items-center gap-3">
          <TeamAvatar name={t.name} size="sm" />
          <span className="font-semibold text-foreground">{t.name}</span>
        </div>
      ),
    },
    {
      key: "city",
      title: "City",
      render: (t: Team) => (
        <div className="flex items-center gap-1.5 text-muted text-sm">
          <MapPin size={13} />
          <span>{t.city || "—"}</span>
        </div>
      ),
    },
    {
      key: "players",
      title: "Squad",
      render: (t: Team) => {
        const count = t.players?.length || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              count > 0
                ? "bg-accent/10 text-accent-dark border-accent/20"
                : "bg-gray-100 text-muted border-border"
            }`}
          >
            <Users size={11} />
            {count} {count === 1 ? "player" : "players"}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (t: Team) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewSquad(t);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Shield size={12} />
            Squad
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(t);
            }}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(t);
            }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Teams
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {total > 0
              ? `${total} team${total !== 1 ? "s" : ""} registered`
              : "Manage your cricket teams"}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Team</span>
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
          placeholder="Search teams..."
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
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-5 bg-gray-100 rounded w-1/4 mt-1" />
                </div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl mt-3" />
            </div>
          ))
        ) : teams.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-10 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield size={26} className="text-primary" />
            </div>
            <p className="font-semibold text-foreground">No teams yet</p>
            <p className="text-sm text-muted mt-1">
              Create your first team to get started
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl"
            >
              Add Team
            </button>
          </div>
        ) : (
          teams.map((team: Team) => {
            const color = getTeamColor(team.name);
            const playerCount = team.players?.length || 0;
            return (
              <div
                key={team.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Color accent stripe */}
                <div className={`h-1 w-full bg-gradient-to-r ${color.bg}`} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <TeamAvatar name={team.name} size="lg" />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base leading-tight truncate">
                        {team.name}
                      </h3>
                      {team.city && (
                        <div className="flex items-center gap-1 text-muted text-sm mt-0.5">
                          <MapPin size={12} />
                          <span>{team.city}</span>
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full border ${
                          playerCount > 0
                            ? "bg-accent/10 text-accent-dark border-accent/20"
                            : "bg-gray-100 text-muted border-border"
                        }`}
                      >
                        <Users size={10} />
                        {playerCount} {playerCount === 1 ? "player" : "players"}
                      </span>
                    </div>

                    {/* Icon actions top-right */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(team)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-primary/10 text-muted hover:text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(team)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-destructive/10 text-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Full-width squad CTA */}
                  <button
                    onClick={() => handleViewSquad(team)}
                    className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${color.bg} shadow-sm active:scale-[0.98] transition-transform`}
                  >
                    <Shield size={14} />
                    Manage Squad
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile pagination */}
        {!loading && teams.length > 0 && total > pageSize && (
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-xs text-muted">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
              {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTeams(debouncedSearch, page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 bg-white"
              >
                Prev
              </button>
              <button
                onClick={() => fetchTeams(debouncedSearch, page + 1)}
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
          data={teams}
          columns={columns}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={(newPage) => fetchTeams(debouncedSearch, newPage)}
          emptyMessage="No teams found"
          onRowClick={(team) => setDetailTeam(team)}
        />
      </div>

      {/* Modals */}
      <TeamFormModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        team={selectedTeam}
      />
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team"
        description={`Are you sure you want to delete "${teamToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
      <AssignPlayersModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        team={teamToAssign}
      />
      <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />
    </div>
  );
}
