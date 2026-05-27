"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Shield,
  MapPin,
  Users,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

import { useTeamStore } from "@/app/store/teams.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import { useAuthStore } from "@/app/store/auth.store";
import { Team } from "@/app/types/teams.types";
import { TeamFormModal } from "@/app/components/teams/team-form-modal";
import {
  TeamTypeSelector,
  TeamCreationType,
} from "@/app/components/teams/team-type-selector";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/app/utils/error-handler";
import toast from "react-hot-toast";

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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
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
  const words = name.split(" ");
  let initials = "";

  for (let word of words) {
    initials += word[0];
  }

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

export function MyCricketTeamsTab() {
  const { teams, total, page, pageSize, fetchTeams, deleteTeam, loading } =
    useTeamStore();
  const { fetchTournaments } = useTournamentStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creationType, setCreationType] =
    useState<TeamCreationType>("individual");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTeams("", 1);
  }, []);

  const myTeams = teams;

  const handleCreate = () => {
    setTypeSelectorOpen(true);
  };

  const handleTypeSelect = (type: TeamCreationType) => {
    setTypeSelectorOpen(false);
    setCreationType(type);
    setCreateOpen(true);
  };

  const handleFormClose = () => {
    setCreateOpen(false);
    if (creationType === "tournament") {
      fetchTournaments("", 1);
    }
  };

  const handleTeamClick = (team: Team) => {
    router.push(`/my-cricket/teams/${team.id}`);
  };

  const handleEdit = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setEditOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setDeleteOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!selectedTeam) return;
    try {
      setDeleting(true);
      await deleteTeam(selectedTeam.id);
      toast.success("Team deleted successfully");
      setDeleteOpen(false);
      setSelectedTeam(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {myTeams.length > 0
            ? `${myTeams.length} team${myTeams.length !== 1 ? "s" : ""} associated with you`
            : "No teams found"}
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary/20 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Team</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {myTeams.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary/60" />
          </div>
          <p className="font-semibold text-foreground">No teams yet</p>
          <p className="text-sm text-muted mt-1.5">
            Create your first team to get started
          </p>
          <button
            onClick={handleCreate}
            className="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Add Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {myTeams.map((team: Team) => {
            const color = getTeamColor(team.name);
            const playerCount =
              Number(team.player_count) || team.players?.length || 0;

            return (
              <div
                key={team.id}
                onClick={() => handleTeamClick(team)}
                className="group cursor-pointer bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`h-[3px] w-full bg-gradient-to-r ${color.bg}`}
                />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <TeamAvatar name={team.name} size="lg" />

                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-foreground text-[15px] leading-tight truncate group-hover:text-primary transition-colors">
                        {team.name}
                      </h3>
                      {team.city && (
                        <div className="flex items-center gap-1 text-muted text-sm mt-1">
                          <MapPin size={12} />
                          <span className="truncate">{team.city}</span>
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

                    {team.created_by === user?.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEdit(e, team)}
                          className="p-1.5 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title="Edit Team"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, team)}
                          className="p-1.5 text-muted hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50 text-primary text-[13px] font-semibold">
                    View Team Details
                    <ChevronRight
                      size={15}
                      className="translate-x-0 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && myTeams.length > 0 && total > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTeams("", page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-border rounded-xl disabled:opacity-40 bg-white hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => fetchTeams("", page + 1)}
              disabled={page * pageSize >= total}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <TeamTypeSelector
        open={typeSelectorOpen}
        onClose={() => setTypeSelectorOpen(false)}
        onSelect={handleTypeSelect}
      />

      <TeamFormModal
        open={createOpen}
        onClose={handleFormClose}
        mode="create"
        team={null}
        creationType={creationType}
      />

      <TeamFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedTeam(null);
        }}
        mode="edit"
        team={selectedTeam}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={onConfirmDelete}
        title="Delete Team"
        description={`Are you sure you want to delete "${selectedTeam?.name}"? This will permanently remove the team and its data.`}
        confirmText="Delete Team"
        loading={deleting}
      />
    </div>
  );
}
