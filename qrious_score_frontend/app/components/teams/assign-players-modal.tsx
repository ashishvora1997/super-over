"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/app/components/ui/modal/modal";
import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { usePlayerStore } from "@/app/store/players.store";
import { useTeamStore } from "@/app/store/teams.store";
import {
  assignPlayers,
  setCaptain,
  setWicketKeeper,
} from "@/app/services/teams.service";
import toast from "react-hot-toast";
import { Team } from "@/app/types/teams.types";
import { getErrorMessage } from "@/app/utils/error-handler";

export function AssignPlayersModal({
  open,
  onClose,
  team,
}: {
  open: boolean;
  onClose: () => void;
  team: Team | null;
}) {
  const { playersList, fetchPlayersList } = usePlayerStore();
  const { updateCaptainInStore, updateWicketKeeperInStore } = useTeamStore();

  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingCaptain, setSettingCaptain] = useState<number | null>(null);
  const [currentCaptainId, setCurrentCaptainId] = useState<number | null>(null);
  const [settingWicketKeeper, setSettingWicketKeeper] = useState<number | null>(
    null,
  );
  const [currentWicketKeeperId, setCurrentWicketKeeperId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (open) {
      fetchPlayersList();
    }
  }, [open]);

  useEffect(() => {
    if (team?.players) {
      setSelected(team.players.map((p) => p.id));
    }
    setCurrentCaptainId(team?.captain_id ?? null);
    setCurrentWicketKeeperId(team?.wicket_keeper_id ?? null);
  }, [team]);

  const handleSubmit = async () => {
    if (!team) return;

    const { fetchTeams, search, page } = useTeamStore.getState();

    try {
      setLoading(true);

      await assignPlayers({
        team_id: team.id,
        player_ids: selected,
      });

      await fetchTeams(search, page);
      toast.success("Players assigned successfully");
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetCaptain = async (playerId: number) => {
    if (!team) return;
    try {
      setSettingCaptain(playerId);
      await setCaptain({ team_id: team.id, player_id: playerId });
      setCurrentCaptainId(playerId);
      updateCaptainInStore(team.id, playerId);
      toast.success("Captain assigned successfully");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSettingCaptain(null);
    }
  };

  const handleSetWicketKeeper = async (playerId: number) => {
    if (!team) return;
    try {
      setSettingWicketKeeper(playerId);
      await setWicketKeeper({ team_id: team.id, player_id: playerId });
      setCurrentWicketKeeperId(playerId);
      updateWicketKeeperInStore(team.id, playerId);
      toast.success("Wicket Keeper assigned successfully");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSettingWicketKeeper(null);
    }
  };

  const assignedPlayers = playersList.filter((p) => selected.includes(p.id));
  const options = playersList.map((p) => ({ label: p.name, value: p.id }));

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={`Manage Squad — ${team?.name}`} onClose={onClose} />

      <ModalBody>
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Squad Players
          </p>
          <MultiSelect
            options={options}
            value={selected}
            onChange={setSelected}
          />
        </div>

        {assignedPlayers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Captain
            </p>
            <div className="relative">
              <Crown
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
              />
              <select
                value={currentCaptainId ?? ""}
                onChange={(e) => {
                  const playerId = Number(e.target.value);
                  if (playerId) handleSetCaptain(playerId);
                }}
                disabled={settingCaptain !== null}
                className="w-full pl-8 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white appearance-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60 transition-colors"
              >
                <option value="">Select a captain...</option>
                {assignedPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role?.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {currentCaptainId && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Crown size={10} />
                {assignedPlayers.find((p) => p.id === currentCaptainId)?.name ??
                  "—"}{" "}
                is captain
              </div>
            )}
          </div>
        )}

        {assignedPlayers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Wicket Keeper
            </p>
            <div className="relative">
              <select
                value={currentWicketKeeperId ?? ""}
                onChange={(e) => {
                  const playerId = Number(e.target.value);
                  if (playerId) handleSetWicketKeeper(playerId);
                }}
                disabled={settingWicketKeeper !== null}
                className="w-full pl-4 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white appearance-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 transition-colors"
              >
                <option value="">Select a wicket keeper...</option>
                {assignedPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role?.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {currentWicketKeeperId && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {assignedPlayers.find((p) => p.id === currentWicketKeeperId)
                  ?.name ?? "—"}{" "}
                is wicket keeper
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Squad"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
