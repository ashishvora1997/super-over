"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Shield, Check, Search, X, Loader2 } from "lucide-react";
import { Tournament, TournamentTeam } from "@/app/types/tournaments.types";
import { TeamFormModal } from "@/app/components/teams/team-form-modal";
import { useTeamStore } from "@/app/store/teams.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import { useAuthStore } from "@/app/store/auth.store";
import { removeTeamFromTournament } from "@/app/services/tournament.service";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { Modal, ModalHeader, ModalBody } from "@/app/components/ui/modal/modal";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";

interface TeamsTabProps {
  tournament: Tournament;
  onUpdate?: () => void;
}

function getTeamColor(id: number) {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];
  return colors[id % colors.length];
}

function TeamCard({
  team,
  isOwner,
  onRemove,
  removing,
}: {
  team: TournamentTeam;
  isOwner: boolean;
  onRemove: (team: TournamentTeam) => void;
  removing: boolean;
}) {
  const initial = team.name.charAt(0).toUpperCase();
  const colorClass = getTeamColor(team.id);

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {team.name}
          </h4>
          {team.city && (
            <p className="text-xs text-muted flex items-center gap-1">
              <Shield size={12} />
              {team.city}
            </p>
          )}
        </div>
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(team);
            }}
            disabled={removing}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-red-50 transition-all flex-shrink-0"
            title="Remove from tournament"
          >
            {removing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function TeamsTab({ tournament, onUpdate }: TeamsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [removingTeamId, setRemovingTeamId] = useState<number | null>(null);
  const [teamToRemove, setTeamToRemove] = useState<TournamentTeam | null>(null);

  const { teams: allTeams, fetchTeams, loading: teamsLoading } = useTeamStore();
  const { assignTeams } = useTournamentStore();
  const user = useAuthStore((s) => s.user);

  const isOwner = user?.id !== undefined && tournament.created_by === user.id;
  const teams = tournament.teams || [];
  const existingTeamIds = teams.map((t) => t.id);

  useEffect(() => {
    if (showAddModal) {
      fetchTeams("", 1);
      setSelectedTeamIds([]);
      setSearchQuery("");
    }
  }, [showAddModal]);

  const availableTeams = allTeams.filter(
    (t) => !existingTeamIds.includes(t.id),
  );

  const filteredTeams = searchQuery.trim()
    ? availableTeams.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : availableTeams;

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    );
  };

  const handleAssignTeams = async () => {
    if (selectedTeamIds.length === 0) {
      toast.error("Select at least one team to add");
      return;
    }

    try {
      setSaving(true);
      await assignTeams({
        tournament_id: tournament.id,
        team_ids: [...existingTeamIds, ...selectedTeamIds],
      });
      toast.success(
        `${selectedTeamIds.length} team${selectedTeamIds.length > 1 ? "s" : ""} added to tournament`,
      );
      setShowAddModal(false);
      onUpdate?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTeam = async () => {
    if (!teamToRemove) return;

    try {
      setRemovingTeamId(teamToRemove.id);
      await removeTeamFromTournament(tournament.id, teamToRemove.id);
      toast.success(`${teamToRemove.name} removed from tournament`);
      setTeamToRemove(null);
      onUpdate?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingTeamId(null);
    }
  };

  const handleTeamCreated = () => {
    setShowCreateForm(false);
    setShowAddModal(false);
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Participating Teams
          </h3>
          <p className="text-sm text-muted">
            {teams.length} {teams.length === 1 ? "team" : "teams"} registered
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} />
            Add Teams
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-1">
            No teams yet
          </h4>
          <p className="text-sm text-muted mb-4">
            Add teams to this tournament to get started
          </p>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
            >
              Add Teams
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isOwner={isOwner}
              onRemove={setTeamToRemove}
              removing={removingTeamId === team.id}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!teamToRemove}
        onClose={() => setTeamToRemove(null)}
        onConfirm={handleRemoveTeam}
        title="Remove Team"
        description={`Are you sure you want to remove "${teamToRemove?.name}" from this tournament? Any scheduled matches involving this team will also be deleted.`}
        confirmText="Remove"
      />

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <ModalHeader
          title={`Add Teams — ${tournament.name}`}
          onClose={() => setShowAddModal(false)}
        />
        <ModalBody>
          <div className="space-y-4 pb-4">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your teams..."
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted/60"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Your Teams
              </p>
              {teamsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted">
                  {searchQuery
                    ? "No matching teams found"
                    : "No available teams to add"}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {filteredTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => toggleTeam(team.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-primary/5 border-2 border-primary/30"
                            : "bg-white border-2 border-border hover:border-primary/20"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg ${getTeamColor(team.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {team.name}
                          </p>
                          {team.city && (
                            <p className="text-xs text-muted">{team.city}</p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowCreateForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <Plus size={16} />
                Create New Team
              </button>
              <button
                onClick={handleAssignTeams}
                disabled={selectedTeamIds.length === 0 || saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-40 transition-colors"
              >
                {saving
                  ? "Adding..."
                  : `Add ${selectedTeamIds.length > 0 ? `(${selectedTeamIds.length})` : "Selected"}`}
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <TeamFormModal
        open={showCreateForm}
        onClose={handleTeamCreated}
        mode="create"
        team={null}
        creationType="tournament"
        initialTournamentId={tournament.id}
      />
    </div>
  );
}
