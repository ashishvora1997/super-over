"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/app/components/ui/modal/form-modal";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { useTeamStore } from "@/app/store/teams.store";
import { useTournamentStore } from "@/app/store/tournament.store";
import toast from "react-hot-toast";
import { Tournament, TournamentTeam } from "@/app/types/tournaments.types";
import { getErrorMessage } from "@/app/utils/error-handler";

interface Props {
  open: boolean;
  onClose: () => void;
  tournament: Tournament;
}

export function AssignTeamsModal({ open, onClose, tournament }: Props) {
  const { teams, fetchTeams } = useTeamStore();
  const { assignTeams } = useTournamentStore();
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchTeams("", 1);
  }, [open]);

  useEffect(() => {
    if (tournament?.teams) {
      setSelected(tournament.teams.map((t) => t.id));
    }
  }, [tournament]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await assignTeams({
        tournament_id: tournament.id,
        team_ids: selected,
      });
      toast.success("Teams updated successfully");
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const options = teams.map((t) => ({
    label: t.name,
    value: t.id,
  }));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Teams — ${tournament?.name ?? ""}`}
      onSubmit={handleSubmit}
      submitText="Save Teams"
      loading={loading}
    >
      <p className="text-xs text-muted -mt-1">
        Select the teams participating in this tournament.
      </p>
      <MultiSelect options={options} value={selected} onChange={setSelected} />
    </FormModal>
  );
}
