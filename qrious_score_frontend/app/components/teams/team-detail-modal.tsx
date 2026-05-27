import { useState } from "react";
import {
  X,
  MapPin,
  Users,
  Shield,
  Calendar,
  Palette,
  Home,
  Trash2,
  Loader2,
} from "lucide-react";
import { Team } from "@/app/types/teams.types";
import { removePlayerFromTeam } from "@/app/services/teams.service";
import { useTeamStore } from "@/app/store/teams.store";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";

interface TeamDetailModalProps {
  team: Team | null;
  onClose: () => void;
}

export function TeamDetailModal({ team, onClose }: TeamDetailModalProps) {
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { fetchTeams, search, page } = useTeamStore();

  const handleRemovePlayer = async (playerId: number) => {
    if (!team) return;
    try {
      setRemovingId(playerId);
      await removePlayerFromTeam(team.id, playerId);
      toast.success("Player removed from team");

      if (team.players) {
        team.players = team.players.filter((p) => p.id !== playerId);
      }
      if (team.captain_id === playerId) {
        team.captain_id = undefined;
        team.captain = undefined;
      }
      if (team.wicket_keeper_id === playerId) {
        team.wicket_keeper_id = undefined;
        team.wicket_keeper = undefined;
      }

      await fetchTeams(search, page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{team.name}</h2>
              <span className="text-sm text-muted font-medium">
                {team.short_name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {team.description && (
            <p className="text-sm text-muted leading-relaxed">
              {team.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Detail
              icon={<MapPin size={14} />}
              label="City"
              value={team.city}
            />
            <Detail
              icon={<Home size={14} />}
              label="Home ground"
              value={team.home_ground}
            />
            <Detail
              icon={<Calendar size={14} />}
              label="Founded"
              value={team.founded_year?.toString()}
            />
            <Detail
              icon={<Palette size={14} />}
              label="Jersey"
              value={team.jersey_color}
            />
            <Detail
              icon={<Users size={14} />}
              label="Squad size"
              value={`${team.players?.length ?? 0} player${team.players?.length === 1 ? "" : "s"}`}
            />
            {team.captain && (
              <Detail
                icon={<Shield size={14} />}
                label="Captain"
                value={team.captain.name}
              />
            )}
            {team.wicket_keeper && (
              <Detail
                icon={<Users size={14} />}
                label="Wicket Keeper"
                value={team.wicket_keeper.name}
              />
            )}
          </div>

          {team.players && team.players.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Squad Players
              </h3>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {player.name}
                      </span>
                      {team.captain_id === player.id && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">
                          C
                        </span>
                      )}
                      {team.wicket_keeper_id === player.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold">
                          WK
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      disabled={removingId === player.id}
                      className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove player"
                    >
                      {removingId === player.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-border/60">
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
