"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { usePlayerStore } from "@/app/store/players.store";
import { assignPlayers } from "@/app/services/teams.service";
import toast from "react-hot-toast";

export function AssignPlayersModal({
  open,
  onClose,
  team,
}: {
  open: boolean;
  onClose: () => void;
  team: any;
}) {
  const { players, fetchPlayers } = usePlayerStore();

  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all players
  useEffect(() => {
    if (open) {
      fetchPlayers("", 1);
    }
  }, [open]);

  // Prefill selected players
  useEffect(() => {
    if (team?.players) {
      setSelected(team.players.map((p: any) => p.id));
    }
  }, [team]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await assignPlayers({
        team_id: team.id,
        player_ids: selected,
      });

      toast.success("Players assigned successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const options = players.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Manage Squad - ${team?.name}`}
      onSubmit={handleSubmit}
      submitText="Save Squad"
      loading={loading}
    >
      <MultiSelect options={options} value={selected} onChange={setSelected} />
    </FormModal>
  );
}
