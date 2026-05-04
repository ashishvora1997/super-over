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
import { Select } from "@/app/components/ui/select";
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
  const [currentCaptainId, setCurrentCaptainId] = useState<number | null>(null);
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

      if (currentCaptainId && selected.includes(currentCaptainId)) {
        await setCaptain({ team_id: team.id, player_id: currentCaptainId });
        updateCaptainInStore(team.id, currentCaptainId);
      }

      if (currentWicketKeeperId && selected.includes(currentWicketKeeperId)) {
        await setWicketKeeper({
          team_id: team.id,
          player_id: currentWicketKeeperId,
        });
        updateWicketKeeperInStore(team.id, currentWicketKeeperId);
      }

      await fetchTeams(search, page);
      toast.success("Squad saved successfully");
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetCaptain = (playerId: number) => {
    setCurrentCaptainId(playerId);
  };

  const handleSetWicketKeeper = (playerId: number) => {
    setCurrentWicketKeeperId(playerId);
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
            itemName="player"
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Captain
          </p>
          <Select
            value={currentCaptainId ? String(currentCaptainId) : ""}
            onChange={(val) => {
              const playerId = Number(val);
              if (playerId) handleSetCaptain(playerId);
            }}
            disabled={assignedPlayers.length === 0}
            placeholder={
              assignedPlayers.length === 0
                ? "Assign players first..."
                : "Select a captain..."
            }
            options={assignedPlayers.map((p) => ({
              label: `${p.name} — ${p.role?.replace("_", " ")}`,
              value: String(p.id),
            }))}
          />

          {currentCaptainId && assignedPlayers.length > 0 ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Crown size={10} />
              {assignedPlayers.find((p) => p.id === currentCaptainId)?.name ??
                "—"}{" "}
              is captain
            </div>
          ) : (
            assignedPlayers.length > 0 && (
              <div className="mt-2 text-xs text-muted italic">
                No captain selected
              </div>
            )
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Wicket Keeper
          </p>
          <Select
            value={currentWicketKeeperId ? String(currentWicketKeeperId) : ""}
            onChange={(val) => {
              const playerId = Number(val);
              if (playerId) handleSetWicketKeeper(playerId);
            }}
            disabled={assignedPlayers.length === 0}
            placeholder={
              assignedPlayers.length === 0
                ? "Assign players first..."
                : "Select a wicket keeper..."
            }
            options={assignedPlayers.map((p) => ({
              label: `${p.name} — ${p.role?.replace("_", " ")}`,
              value: String(p.id),
            }))}
          />

          {currentWicketKeeperId && assignedPlayers.length > 0 ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {assignedPlayers.find((p) => p.id === currentWicketKeeperId)
                ?.name ?? "—"}{" "}
              is wicket keeper
            </div>
          ) : (
            assignedPlayers.length > 0 && (
              <div className="mt-2 text-xs text-muted italic">
                No wicket keeper selected
              </div>
            )
          )}
        </div>
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
