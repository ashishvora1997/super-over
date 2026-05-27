"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Users,
  Shield,
  Calendar,
  Palette,
  Home,
  UserPlus,
  Crown,
  Settings2,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";

import { useTeamStore } from "@/app/store/teams.store";
import { useAuthStore } from "@/app/store/auth.store";
import { Team } from "@/app/types/teams.types";
import { AddPlayerByEmailModal } from "@/app/components/teams/add-player-by-email-modal";
import { AssignRolesModal } from "@/app/components/teams/assign-roles-modal";
import { removePlayerFromTeam } from "@/app/services/teams.service";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { getTeamAvatarText } from "@/app/utils/cricket.utils";

const MAX_PLAYERS = 11;
const MIN_PLAYERS = 2;

function getTeamColor(name: string) {
  const colors = [
    { bg: "from-blue-600 to-blue-800" },
    { bg: "from-emerald-600 to-emerald-800" },
    { bg: "from-violet-600 to-violet-800" },
    { bg: "from-rose-600 to-rose-800" },
    { bg: "from-amber-500 to-amber-700" },
    { bg: "from-cyan-600 to-cyan-800" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50 border border-border/60">
      <span className="text-muted mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-foreground font-medium mt-0.5">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = Number(params.teamId);

  const { teams, fetchTeamById, loading } = useTeamStore();
  const user = useAuthStore((state) => state.user);
  const [team, setTeam] = useState<Team | null>(null);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [assignRolesOpen, setAssignRolesOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemovePlayer = async (playerId: number) => {
    if (!team) return;
    try {
      setRemovingId(playerId);
      await removePlayerFromTeam(team.id, playerId);
      toast.success("Player removed from team");

      const newPlayers = team.players?.filter((p) => p.id !== playerId) || [];
      const newTeam = {
        ...team,
        players: newPlayers,
        captain_id: team.captain_id === playerId ? undefined : team.captain_id,
        captain: team.captain_id === playerId ? undefined : team.captain,
        wicket_keeper_id:
          team.wicket_keeper_id === playerId
            ? undefined
            : team.wicket_keeper_id,
        wicket_keeper:
          team.wicket_keeper_id === playerId ? undefined : team.wicket_keeper,
      };
      setTeam(newTeam);

      await fetchTeamById(team.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    fetchTeamById(teamId);
  }, [teamId]);

  useEffect(() => {
    const found = teams.find((t) => t.id === teamId);
    if (found) setTeam(found);
  }, [teams, teamId]);

  if (loading && !team) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-200" />
          <div className="h-5 bg-gray-200 rounded w-32" />
        </div>
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted">Team not found</p>
        <button
          onClick={() => router.push("/my-cricket?tab=teams")}
          className="mt-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  const color = getTeamColor(team.name);
  const playerCount = team.players?.length || 0;
  const isOwner = user?.id !== undefined && team.created_by === user.id;
  const isMaxPlayers = playerCount >= MAX_PLAYERS;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/my-cricket?tab=teams")}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to My Cricket
      </button>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className={`h-1.5 w-full bg-gradient-to-r ${color.bg}`} />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color.bg} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}
              >
                {getTeamAvatarText(team.name)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {team.name}
                </h1>
                <p className="text-sm text-muted font-medium mt-0.5">
                  {team.short_name}
                </p>
              </div>
            </div>

            {isOwner && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 text-primary text-xs font-semibold rounded-full border border-primary/20">
                <Crown size={12} />
                Owner
              </span>
            )}
          </div>

          {team.description && (
            <p className="text-sm text-muted leading-relaxed mt-4">
              {team.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <DetailCard
              icon={<MapPin size={14} />}
              label="City"
              value={team.city}
            />
            <DetailCard
              icon={<Home size={14} />}
              label="Home Ground"
              value={team.home_ground}
            />
            <DetailCard
              icon={<Calendar size={14} />}
              label="Founded"
              value={team.founded_year?.toString()}
            />
            <DetailCard
              icon={<Palette size={14} />}
              label="Jersey Color"
              value={team.jersey_color}
            />
            <DetailCard
              icon={<Users size={14} />}
              label="Squad Size"
              value={`${playerCount} / ${MAX_PLAYERS} players`}
            />
            {team.captain && (
              <DetailCard
                icon={<Shield size={14} />}
                label="Captain"
                value={team.captain.name}
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Squad</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isMaxPlayers
                  ? "text-amber-700 bg-amber-50 border border-amber-200"
                  : "text-muted bg-gray-100"
              }`}
            >
              {playerCount}/{MAX_PLAYERS}
            </span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              {playerCount >= MIN_PLAYERS && (
                <button
                  onClick={() => setAssignRolesOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <Settings2 size={15} />
                  <span className="hidden sm:inline">Assign Roles</span>
                </button>
              )}
              <button
                onClick={() => setAddPlayerOpen(true)}
                disabled={isMaxPlayers}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={15} />
                <span className="hidden sm:inline">Add Player</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {isOwner && isMaxPlayers && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Maximum {MAX_PLAYERS} players reached. Remove a player to add
                new ones.
              </p>
            </div>
          )}

          {isOwner && playerCount > 0 && playerCount < MIN_PLAYERS && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 mb-4">
              <AlertCircle size={15} className="text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                Add at least {MIN_PLAYERS} players to assign team roles.
              </p>
            </div>
          )}

          {playerCount === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No players in the squad yet
              </p>
              <p className="text-xs text-muted mt-1">
                Add players to build your team
              </p>
              {isOwner && (
                <button
                  onClick={() => setAddPlayerOpen(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <UserPlus size={15} />
                  Add Player
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.players?.map((player) => {
                const isCaptain = team.captain_id === player.id;
                const isWicketKeeper = team.wicket_keeper_id === player.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isCaptain
                        ? "border-amber-200 bg-amber-50/40"
                        : isWicketKeeper
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-border/60 bg-gray-50/50 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isCaptain
                          ? "bg-amber-200 text-amber-800"
                          : isWicketKeeper
                            ? "bg-blue-200 text-blue-800"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {player.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isCaptain && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                            <Crown size={9} />
                            Captain
                          </span>
                        )}
                        {isWicketKeeper && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">
                            <Shield size={9} />
                            WK
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={removingId === player.id}
                        className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Remove player"
                      >
                        {removingId === player.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isOwner && team && (
        <AddPlayerByEmailModal
          open={addPlayerOpen}
          onClose={() => setAddPlayerOpen(false)}
          teamId={team.id}
          teamName={team.name}
          onPlayerAdded={() => fetchTeamById(team.id)}
        />
      )}

      {isOwner && team && (
        <AssignRolesModal
          open={assignRolesOpen}
          onClose={() => setAssignRolesOpen(false)}
          teamId={team.id}
          teamName={team.name}
          players={team.players || []}
          currentCaptainId={team.captain_id}
          currentWicketKeeperId={team.wicket_keeper_id}
          onRolesUpdated={() => fetchTeamById(team.id)}
        />
      )}
    </div>
  );
}
